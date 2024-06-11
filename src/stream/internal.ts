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
import { SubscriptionTimeoutError, sleep, EmptyPipelineError } from '../utils/index.js'
import {
  map,
  filter,
  tap,
  reduce,
  scan,
  skip,
  bufferCount,
  take,
  catchError,
  defaultIfEmpty,
  throwIfEmpty,
  groupBy,
  pairwise,
  split,
  distinct,
  finalize,
  skipWhile,
  takeWhile,
  skipLast,
  takeLast,
  mergeScan,
  timestamp
} from '../operators/index.js'
import { Fs } from './functional-stream.js'
import { throttle } from '../operators/throttle.js'

export class FsInternal<T> implements IFs<T> {
  protected constructor(protected source: ISubject<T>) {}

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
    return new FsInternal(sub)
  }

  protected copyTo(sub: ISubject<T>): IFs<T> {
    sub.add(this.source)
    return new FsInternal<T>(sub)
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

  lastOne(): Promise<T> {
    return new Promise((resolve, error) => {
      let result: T
      this.watch({
        next(event) {
          result = event
        },
        error,
        complete() {
          resolve(result)
        }
      })
    })
  }

  firstOne(): Promise<T> {
    return this.take(1).lastOne()
  }

  toArray(): Promise<T[]> {
    return this.reduce((acc, cur) => acc.concat([cur]), [] as T[]).lastOne()
  }

  forEach(callback: TMapCallback<T, any>): Promise<void> {
    return new Promise((complete, error) => {
      let i = 0
      this.watch({
        next(data) {
          callback(data, i++)
        },
        error,
        complete
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
    return this.mergeScan<R>(
      (_, cur, index) => callback(cur, index),
      null as R,
      concurrency
    )
  }

  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.mergeMap(callback, 1)
  }

  exhaustMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    let blocked = false
    return this.mergeMap((e, i) => {
      if (blocked) {
        return Fs.empty()
      }

      blocked = true
      return Fs.from(callback(e, i)).finalize(() => (blocked = false))
    })
  }

  switchMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.switchScan((_, cur, i) => callback(cur, i), null as R)
  }

  switchScan<R>(callback: TReduceCallback<R, T, StreamLike<R>>, initialValue: R): IFs<R> {
    let current = 0
    return this.mergeScan((acc, cur, i) => {
      current = i
      return Fs.from(callback(acc, cur, i)).filter(() => current.equal(i))
    }, initialValue)
  }

  mergeScan<R>(
    callback: (acc: R, cur: T, index: number) => StreamLike<R>,
    initialValue: R,
    concurrency = -1
  ): IFs<R> {
    if (concurrency.lessThanOrEqual(0)) {
      return this.pipe(mergeScan(callback, initialValue))
    }

    return this.pipeTo(async (sub) => {
      try {
        const iter = this.iter()
        let index = 0
        await Promise.all(
          new Array(concurrency).fill(null).map(async () => {
            for (let data = await iter.next(); !data.done; data = await iter.next()) {
              await Fs.from(callback(initialValue, data.value, index++))
                .tap((e) => sub.publish(e))
                .lastOne()
            }
          })
        )
      } catch (err) {
        sub.abort(err)
      } finally {
        sub.commit()
      }
    })
  }

  finalize(callback: TAnyCallback): IFs<T> {
    return this.pipe(finalize(callback))
  }

  delay(ms: number): IFs<T> {
    return this.mergeMap((e) => Fs.delay(ms).map(() => e))
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

  throwIfEmpty(err: unknown = new EmptyPipelineError()): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    return this.pipe(groupBy(callback))
  }

  timeout(each: number): IFs<T> {
    return this.pipeTo(async (sub) => {
      try {
        const iter = this.iter()
        const next = () =>
          Promise.race([
            iter.next(),
            sleep(each).then(() => Promise.reject(new SubscriptionTimeoutError()))
          ])

        for (let data = await next(); !data.done; data = await next()) {
          sub.publish(data.value)
        }
      } catch (err) {
        sub.abort(err)
      } finally {
        sub.commit()
      }
    })
  }

  startWith(v: T): IFs<T> {
    return Fs.of(v).chain(this)
  }

  endWith(v: T): IFs<T> {
    return this.chain(Fs.of(v))
  }

  pairwise(): IFs<[T, T]> {
    return this.pipe(pairwise())
  }

  split(delimiter: string) {
    return this.pipe(split(delimiter) as any) as any
  }

  distinct<K>(callback: TMapCallback<T, K> = (e) => e as any): IFs<T> {
    return this.pipe(distinct(callback))
  }

  skipWhile(callback: TMapCallback<T, boolean>): IFs<T> {
    return this.pipe(skipWhile(callback))
  }

  takeWhile(callback: TMapCallback<T, boolean>): IFs<T> {
    return this.pipe(takeWhile(callback))
  }

  bufferTime(interval: number): IFs<T[]> {
    return this.bufferWhen(() => Fs.interval(interval))
  }

  skipLast(count: number): IFs<T> {
    return this.pipe(skipLast(count))
  }

  takeLast(count: number): IFs<T> {
    return this.pipe(takeLast(count))
  }

  audit<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<T> {
    let last: T
    let blocked = false
    return this.mergeMap((e, i) => {
      last = e

      if (blocked) {
        return Fs.empty()
      }

      blocked = true
      return Fs.from(callback(e, i)).take(1)
    })
      .map(() => last)
      .tap(() => (blocked = false))
  }

  throttle<R>(callback: (arg: T) => StreamLike<R>): IFs<T> {
    return this.pipe(throttle(callback))
  }

  bufferWhen<R>(callback: () => StreamLike<R>): IFs<T[]> {
    return this.pipeTo((sub) => {
      let queue: T[] = []
      let done = false
      const trigger = Fs.from(callback())
      sub.add(() => trigger.close())
      trigger.watch({
        next() {
          sub.publish(queue)
          queue = []
          if (done) {
            sub.commit()
          }
        }
      })

      this.watch({
        next(data) {
          queue.push(data)
        },
        error(err) {
          sub.abort(err)
        },
        complete() {
          done = true
        }
      })
    })
  }

  timestamp(): IFs<number> {
    return this.pipe(timestamp())
  }

  timeInterval(): IFs<number> {
    return this.timestamp()
      .pairwise()
      .map(([prev, cur]) => cur.subtract(prev))
  }
}
