import { IFs, IStreamReadOptions, StreamLike } from './@types/stream'
import {
  Pipeline,
  fromAsyncIterable,
  fromIterable,
  fromPromise,
  fromReadable
} from './observer/pipeline'
import { isAsyncIterable, isIterable } from './functions'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './@types/callback'
import { map } from './operators/map'
import { filter } from './operators/filter'
import { tap } from './operators/tap'
import { reduce } from './operators/reduce'
import { skip } from './operators/skip'
import { bufferCount } from './operators/buffer-count'
import { take } from './operators/take'
import { mergeAll, mergeMap } from './operators/merge'
import { catchError } from './operators/error'
import { ifEmpty } from './operators/empty'
import { Subject } from './observer'
import { groupBy } from './operators/group'

export class Fs<T> implements IFs<T> {
  constructor(private source: Subject<T>) {}

  static of<T>(...v: T[]): IFs<T> {
    return Fs.from(v)
  }

  static from<T>(like: StreamLike<T>): IFs<T> {
    if (like instanceof Fs) {
      return like as IFs<T>
    }

    if (like instanceof Subject) {
      return new Fs(like)
    }

    if (isIterable(like)) {
      return new Fs(fromIterable(like as Iterable<T>))
    }

    if (isAsyncIterable(like)) {
      return new Fs(fromAsyncIterable(like as AsyncIterable<T>))
    }

    if (like instanceof ReadableStream) {
      return new Fs(fromReadable(like))
    }

    if (like instanceof Promise) {
      return new Fs(fromPromise(like))
    }

    throw new Error('stream type is not supported')
  }

  static merge<T>(...streams: StreamLike<T>[]): IFs<T> {
    return Fs.from(streams).mergeAll()
  }

  static concat<T>(...streams: StreamLike<T>[]): IFs<T> {
    return Fs.from(streams).concatAll()
  }

  static range(count: number, start = 0): IFs<number> {
    return Fs.from({
      *[Symbol.iterator]() {
        for (let i = start; i < count; i++) {
          yield i
        }
      }
    })
  }

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  private pipe<R>(pipeline: Pipeline<T, R>): IFs<R> {
    this.source.add(pipeline)
    const next = this as unknown as Fs<R>
    next.source = pipeline
    return next
  }

  private iter(): AsyncIterator<T> {
    return this[Symbol.asyncIterator]()
  }

  watch(options: IStreamReadOptions<T>) {
    return this.source.add(options)
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

    const sub = new Subject<any>()
    const iter = this.iter()

    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await Fs.from(data.value as any)
            .tap((e) => sub.publish(e))
            .toPromise()
        }
      })
    )
      .catch((err) => sub.abort(err))
      .finally(() => sub.commit())

    return Fs.from(sub)
  }

  concatAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeAll(1)
  }

  mergeMap<R>(
    callback: TMapCallback<T, StreamLike<R>>,
    concurrency: number = -1
  ): IFs<R> {
    if (concurrency < 0) {
      return this.pipe(mergeMap(callback))
    }

    const sub = new Subject<any>()
    const iter = this.iter()
    let index = 0
    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await Fs.from(callback(data.value, index++) as any)
            .tap((e) => sub.publish(e))
            .toPromise()
        }
      })
    )
      .catch((err) => sub.abort(err))
      .finally(() => sub.commit())

    return Fs.from(sub)
  }

  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.mergeMap(callback, 1)
  }

  finalize(callback: TAnyCallback): IFs<T> {
    const sub = new Subject<T>()
    this.watch({
      next(data) {
        sub.publish(data)
      },
      error(err) {
        sub.abort(err)
      },
      complete() {
        return Promise.resolve(callback())
      }
    })

    return Fs.from(sub)
  }

  delay(ms: number): IFs<T> {
    return this.concatMap(
      (e) => new Promise((resolve) => setTimeout(() => resolve(e), ms))
    )
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

    return sub.map((s) => Fs.from(s))
  }

  ifEmpty(callback: TAnyCallback): IFs<T> {
    return this.pipe(ifEmpty(callback))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    return this.pipe(groupBy(callback))
  }
}