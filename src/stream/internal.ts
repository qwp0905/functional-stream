import {
  IFs,
  IStreamReadOptions,
  StreamLike,
  IPipeline,
  ISubject,
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from '../@types/index.js'
import { Subject } from '../observer/index.js'
import { SubscriptionTimeoutError, sleep } from '../utils/index.js'
import {
  map,
  filter,
  tap,
  reduce,
  scan,
  skip,
  bufferCount,
  take,
  mergeMap,
  catchError,
  defaultIfEmpty,
  throwIfEmpty,
  groupBy,
  delay,
  endWith,
  startWith,
  pairwise,
  split
} from '../operators/index.js'
import { Fs } from './functional-stream.js'

export class FsInternal<T> implements IFs<T> {
  constructor(protected source: ISubject<T>) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  protected pipe<R>(pipeline: IPipeline<T, R>): IFs<R> {
    this.source.watch(pipeline)
    pipeline.add(this.source)
    const next = this as unknown as Fs<R>
    next.source = pipeline
    return next
  }

  protected pipeTo<R>(generator: (sub: ISubject<R>) => void): IFs<R> {
    const sub = new Subject<R>()
    sub.add(this.source)
    generator(sub)
    return new Fs(sub)
  }

  protected copyTo(sub: ISubject<T>): IFs<T> {
    sub.add(this.source)
    return new Fs<T>(sub)
  }

  protected iter(): AsyncIterator<T> {
    return this[Symbol.asyncIterator]()
  }

  watch(options: IStreamReadOptions<T>) {
    const [sub, out] = [new Subject<T>(), new Subject<T>()]
    sub.add(out)
    sub.add(this.source)
    out.watch(options)

    this.source.watch({
      next(event) {
        sub.publish(event)
        out.publish(event)
      },
      error(err) {
        sub.abort(err)
        out.abort(err)
      },
      complete() {
        sub.commit()
        out.commit()
      }
    })

    this.source = sub
  }

  close(): void {
    return this.source.close()
  }

  toPromise(): Promise<T> {
    return new Promise((resolve, reject) => {
      let result: T
      this.watch({
        next(event) {
          result = event
        },
        error(err) {
          reject(err)
        },
        complete() {
          resolve(result)
        }
      })
    })
  }

  toArray(): Promise<T[]> {
    return this.reduce((acc, cur) => acc.concat([cur]), [] as T[]).toPromise()
  }

  forEach(callback: TMapCallback<T, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      let i = 0
      this.watch({
        next(data) {
          callback(data, i++)
        },
        error(err) {
          reject(err)
        },
        complete() {
          resolve()
        }
      })
    })
  }

  count(): IFs<number> {
    return this.reduce((acc) => acc + 1, 0)
  }

  some(callback: TFilterCallback<T>): IFs<boolean> {
    return this.reduce((acc, cur, i) => acc || callback(cur, i), false)
  }

  every(callback: TFilterCallback<T>): IFs<boolean> {
    return this.reduce((acc, cur, i) => acc && callback(cur, i), true)
  }

  map<R>(callback: TMapCallback<T, R>): IFs<R> {
    return this.pipe(map(callback))
  }

  filter(callback: TFilterCallback<T>): IFs<T> {
    return this.pipe(filter(callback))
  }

  tap(callback: TTapCallback<T>): IFs<T> {
    return this.pipe(tap(callback))
  }

  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A> {
    return this.pipe(reduce(callback, initialValue))
  }

  scan<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A> {
    return this.pipe(scan(callback, initialValue))
  }

  take(count: number): IFs<T> {
    return this.pipe(take(count))
  }

  skip(count: number): IFs<T> {
    return this.pipe(skip(count))
  }

  bufferCount(count: number): IFs<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(concurrency: number = -1): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeMap((e) => e as any, concurrency)
  }

  concatAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeAll(1)
  }

  exhaustAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.exhaustMap((e) => e as any)
  }

  switchAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.switchMap((e) => e as any)
  }

  mergeMap<R>(
    callback: TMapCallback<T, StreamLike<R>>,
    concurrency: number = -1
  ): IFs<R> {
    if (concurrency < 0) {
      return this.pipe(mergeMap(callback))
    }

    return this.pipeTo((sub) => {
      const iter = this.iter()
      let index = 0
      Promise.all(
        new Array(concurrency).fill(null).map(async () => {
          for (let data = await iter.next(); !data.done; data = await iter.next()) {
            await Fs.from(callback(data.value, index++) as any)
              .tap((e) => sub.publish(e as any))
              .toPromise()
          }
        })
      )
        .catch((err) => sub.abort(err))
        .finally(() => sub.commit())
    })
  }

  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.mergeMap(callback, 1)
  }

  exhaustMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    let blocked = false
    return this.mergeMap((e, i) => {
      if (blocked) {
        return [] as any
      }

      blocked = true
      return Fs.from(callback(e, i)).finalize(() => (blocked = false))
    })
  }

  switchMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    let current = 0
    return this.mergeMap((e, i) => {
      current = i
      return Fs.from(callback(e, i)).filter(() => current === i)
    })
  }

  finalize(callback: TAnyCallback): IFs<T> {
    return this.pipeTo((sub) => {
      this.watch({
        next(data) {
          sub.publish(data)
        },
        error(err) {
          sub.abort(err)
        },
        async complete() {
          await Promise.resolve(callback())
          sub.commit()
        }
      })
    })
  }

  delay(ms: number): IFs<T> {
    return this.pipe(delay(ms))
  }

  chain(stream: StreamLike<T>): IFs<T> {
    return Fs.concat(this, stream)
  }

  catchError(callback: TErrorCallback): IFs<T> {
    return this.pipe(catchError(callback))
  }

  copy(count: number): IFs<T>[] {
    const sub = new Array(count).fill(null).map(() => new Subject<T>())
    this.watch({
      next(data) {
        sub.forEach((s) => s.publish(data))
      },
      error(err) {
        sub.forEach((s) => s.abort(err))
      },
      complete() {
        sub.forEach((s) => s.commit())
      }
    })

    return sub.map((s) => this.copyTo(s))
  }

  defaultIfEmpty(v: T): IFs<T> {
    return this.pipe(defaultIfEmpty(v))
  }

  throwIfEmpty(err: unknown): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    return this.pipe(groupBy(callback))
  }

  timeout(each: number): IFs<T> {
    return this.pipeTo((sub) => {
      const iter = this.iter()
      const next = () =>
        Promise.race([
          iter.next(),
          sleep(each).then(() => Promise.reject(new SubscriptionTimeoutError()))
        ])

      Promise.resolve()
        .then(async () => {
          for (let data = await next(); !data.done; data = await next()) {
            sub.publish(data.value)
          }
        })
        .catch((err) => sub.abort(err))
        .finally(() => sub.commit())
    })
  }

  startWith(v: T): IFs<T> {
    return this.pipe(startWith(v))
  }

  endWith(v: T): IFs<T> {
    return this.pipe(endWith(v))
  }

  pairwise(): IFs<[T, T]> {
    return this.pipe(pairwise())
  }

  repeat(count: number): IFs<T> {
    return Fs.concat(...this.copy(Math.max(0, count)))
  }

  split(delimiter: string) {
    return this.pipe(split(delimiter) as any) as any
  }
}
