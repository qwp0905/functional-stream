import { IFs, IStreamReadOptions, StreamLike } from '../@types/stream.js'
import { isAsyncIterable, isIterable, isReadableStream } from '../utils/functions.js'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from '../@types/callback.js'
import { Subject } from '../observer/subject.js'
import { NotSupportTypeError, SubscriptionTimeoutError } from '../utils/errors.js'
import { IPipeline, ISubject } from '../@types/observer.js'
import { sleep } from '../utils/sleep.js'
import {
  map,
  filter,
  tap,
  reduce,
  scan,
  skip,
  bufferCount,
  take,
  mergeAll,
  mergeMap,
  catchError,
  defaultIfEmpty,
  throwIfEmpty,
  groupBy,
  delay,
  endWith,
  startWith,
  pairwise
} from '../operators/index.js'
import {
  fromAsyncIterable,
  fromAsyncIterator,
  fromEvent,
  fromIterable,
  fromPromise,
  fromReadable
} from './generators.js'

export class Fs<T> implements IFs<T> {
  constructor(private source: ISubject<T>) {}

  static generate<T>(generator: (sub: ISubject<T>) => void): IFs<T> {
    const sub = new Subject<T>()
    generator(sub)
    return new Fs(sub)
  }

  static of<T>(...v: T[]): IFs<T> {
    return fromIterable(v)
  }

  static from<T>(like: StreamLike<T>): IFs<T> {
    if (like instanceof Fs) {
      return like as IFs<T>
    }

    if (like instanceof Subject) {
      return new Fs<T>(like)
    }

    if (isIterable(like)) {
      return fromIterable(like as Iterable<T>)
    }

    if (isAsyncIterable(like)) {
      return fromAsyncIterable(like as AsyncIterable<T>)
    }

    if (isReadableStream(like)) {
      return fromReadable(like as any)
    }

    if (like instanceof Promise) {
      return fromPromise(like)
    }

    throw new NotSupportTypeError()
  }

  static fromEvent<T extends keyof GlobalEventHandlersEventMap>(
    source: EventTarget | GlobalEventHandlers,
    event: T
  ): IFs<GlobalEventHandlersEventMap[T]>
  static fromEvent<T>(source: any, event: string | symbol): IFs<T>

  static fromEvent(source: any, event: string | symbol) {
    return fromEvent(source, event)
  }

  static merge<T>(...streams: StreamLike<T>[]): IFs<T> {
    return fromIterable(streams).mergeAll()
  }

  static concat<T>(...streams: StreamLike<T>[]): IFs<T> {
    return fromIterable(streams).concatAll()
  }

  static range(count: number, start = 0): IFs<number> {
    return Fs.loop(
      start,
      (x) => x < start + count,
      (x) => x + 1
    )
  }

  static loop<T>(
    initialValue: T,
    condFunc: (x: T) => boolean,
    nextFunc: (x: T) => T | Promise<T>
  ): IFs<T> {
    return fromAsyncIterable({
      async *[Symbol.asyncIterator]() {
        for (let x = initialValue; condFunc(x); x = await nextFunc(x)) {
          yield x
        }
      }
    })
  }

  static race<T>(...v: StreamLike<T>[]): IFs<T> {
    return Fs.from(
      Promise.race(
        v.map(async (e) => {
          const iter = (Fs.from(e) as Fs<T>).iter()
          const { value } = await iter.next()
          return fromAsyncIterator(iter).startWith(value)
        })
      )
    ).mergeAll()
  }

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  private pipe<R>(pipeline: IPipeline<T, R>): IFs<R> {
    this.source.watch(pipeline)
    pipeline.add(this.source)
    const next = this as unknown as Fs<R>
    next.source = pipeline
    return next
  }

  private pipeTo<R>(generator: (sub: ISubject<R>) => void): IFs<R> {
    const sub = new Subject<R>()
    sub.add(this.source)
    generator(sub)
    return new Fs(sub)
  }

  private copyTo(sub: ISubject<T>): IFs<T> {
    sub.add(this.source)
    return new Fs<T>(sub)
  }

  private iter(): AsyncIterator<T> {
    return this[Symbol.asyncIterator]()
  }

  watch(options: IStreamReadOptions<T>) {
    return this.source.watch(options)
  }

  unwatch(): void {
    return this.source.commit()
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
    if (concurrency < 0) {
      return this.pipe(mergeAll() as any)
    }

    return this.pipeTo((sub) => {
      const iter = this.iter()
      Promise.all(
        new Array(concurrency).fill(null).map(async () => {
          for (let data = await iter.next(); !data.done; data = await iter.next()) {
            await Fs.from(data.value as any)
              .tap((e) => sub.publish(e as any))
              .toPromise()
          }
        })
      )
        .catch((err) => sub.abort(err))
        .finally(() => sub.commit())
    })
  }

  concatAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeAll(1)
  }

  exhaustAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    let running = false
    return this.mergeMap((e) => {
      if (running) {
        return [] as any
      }

      running = true
      return Fs.from(e as any).finalize(() => (running = false))
    })
  }

  switchAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    let current = 0
    return this.mergeMap((e, i) => {
      current = i
      return Fs.from<any>(e as any).filter(() => i === current)
    })
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
    let running = false
    return this.mergeMap((e, i) => {
      if (running) {
        return [] as any
      }

      running = true
      return Fs.from(callback(e, i)).finalize(() => (running = false))
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
      const next = () => {
        return Promise.race([
          iter.next(),
          sleep(each).then(() => Promise.reject(new SubscriptionTimeoutError()))
        ])
      }

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
}
