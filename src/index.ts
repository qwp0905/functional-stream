import { Readable } from 'stream'
import { IFStream, IStreamReadOptions, Iter, StreamLike } from './@types/stream'
import { Pipeline, fromIterable, fromPromise, fromStream } from './observer/pipeline'
import { isAsyncIterable, isIterable } from './stream/functions'
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
import { concatAll, concatMap } from './operators/concat'
import { delay } from './operators/delay'
import { catchError } from './operators/error'
import { ifEmpty } from './operators/empty'

export class FStream<T> implements IFStream<T> {
  constructor(private source: Pipeline<any, T>) {}

  static from<T>(like: StreamLike<T>): IFStream<T> {
    if (like instanceof FStream) {
      return like as IFStream<T>
    }

    if (like instanceof Pipeline) {
      return new FStream(like)
    }

    if (like instanceof Readable) {
      return new FStream(fromStream<T>(like))
    }

    if (isAsyncIterable(like) || isIterable(like)) {
      return new FStream(fromIterable(like as Iter<T>))
    }

    if (like instanceof Promise) {
      return new FStream(fromPromise(like))
    }

    throw new Error('stream type is not supported')
  }

  static merge<T>(...streams: StreamLike<T>[]): IFStream<T> {
    return FStream.from(streams).mergeAll()
  }

  static concat<T>(...streams: StreamLike<T>[]): IFStream<T> {
    return FStream.from(streams).concatAll()
  }

  static range(count: number, start = 0): IFStream<number> {
    return FStream.from({
      *[Symbol.iterator]() {
        for (let i = start; i < count; i++) {
          yield i
        }
      }
    })
  }

  async *[Symbol.asyncIterator]() {
    for await (const data of this.source) {
      yield data
    }
  }

  private pipe<R>(pipeline: Pipeline<T, R>): IFStream<R> {
    const next = this as unknown as FStream<R>
    next.source = this.source.pipe(pipeline)
    return next
  }

  private iter(): AsyncIterator<T> {
    return this[Symbol.asyncIterator]()
  }

  watch(options: IStreamReadOptions<T>) {
    return this.source.add(options)
  }

  promise(): Promise<T> {
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

  array(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const result: T[] = []
      this.watch({
        next(event) {
          result.push(event)
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

  some(callback: TFilterCallback<T>): Promise<boolean> {
    let index = 0
    return new Promise((resolve, reject) => {
      let result = false
      this.watch({
        next(data) {
          result ||= callback(data, index++)
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

  every(callback: TFilterCallback<T>): Promise<boolean> {
    let index = 0
    return new Promise((resolve, reject) => {
      let result = true
      this.watch({
        next(data) {
          result &&= callback(data, index++)
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

  map<R>(callback: TMapCallback<T, R>): IFStream<R> {
    return this.pipe(map(callback))
  }

  filter(callback: TFilterCallback<T>): IFStream<T> {
    return this.pipe(filter(callback))
  }

  tap(callback: TTapCallback<T>): IFStream<T> {
    return this.pipe(tap(callback))
  }

  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFStream<A> {
    return this.pipe(reduce(callback, initialValue))
  }

  take(count: number): IFStream<T> {
    return this.pipe(take(count))
  }

  skip(count: number): IFStream<T> {
    return this.pipe(skip(count))
  }

  bufferCount(count: number): IFStream<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(
    concurrency: number = -1
  ): IFStream<T extends StreamLike<infer K> ? K : never> {
    if (concurrency < 0) {
      return this.pipe(mergeAll() as any)
    }

    const sub = new Pipeline<T, any>()
    const iter = this.iter()

    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await FStream.from(data.value as any)
            .tap((e) => sub.publish(e))
            .promise()
            .catch((err) => sub.abort(err))
            .finally(() => sub.complete())
        }
      })
    )
    return FStream.from(sub)
  }

  concatAll(): IFStream<T extends StreamLike<infer K> ? K : never> {
    return this.pipe(concatAll() as any)
  }

  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency: number = -1
  ): IFStream<R extends StreamLike<infer K> ? K : never> {
    if (concurrency < 0) {
      return this.pipe(mergeMap(callback as any))
    }

    const sub = new Pipeline<T, any>()
    const iter = this.iter()
    let index = 0
    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await FStream.from(callback(data.value, index++) as any)
            .tap((e) => sub.publish(e))
            .promise()
        }
      })
    )
      .catch((err) => sub.abort(err))
      .finally(() => sub.commit())

    return FStream.from(sub)
  }

  concatMap<R = T>(
    callback: TMapCallback<T, R>
  ): IFStream<R extends StreamLike<infer K> ? K : never> {
    return this.pipe(concatMap(callback as any))
  }

  finalize(callback: TAnyCallback): IFStream<T> {
    const sub = new Pipeline<T>()
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

    return FStream.from(sub)
  }

  delay(ms: number): IFStream<T> {
    return this.pipe(delay(ms))
  }

  chain(stream: StreamLike<T>): IFStream<T> {
    const sub = new Pipeline<T>()
    this.watch({
      next(data) {
        sub.publish(data)
      },
      error(err) {
        sub.abort(err)
      },
      complete() {
        FStream.from(stream).watch({
          next(data: T) {
            sub.publish(data)
          },
          error(err) {
            sub.abort(err)
          },
          complete() {
            sub.commit()
          }
        })
      }
    })

    return FStream.from(sub)
  }

  catchError(callback: TErrorCallback): IFStream<T> {
    return this.pipe(catchError(callback))
  }

  copy(count: number): IFStream<T>[] {
    const pass = new Array(count).fill(null).map(() => new Pipeline<T>())
    this.watch({
      next(data) {
        pass.forEach((s) => s.publish(data))
      },
      error(err) {
        pass.forEach((s) => s.abort(err))
      },
      complete() {
        pass.forEach((s) => s.commit())
      }
    })

    return pass.map((s) => FStream.from(s))
  }

  ifEmpty(callback: TAnyCallback): IFStream<T> {
    return this.pipe(ifEmpty(callback))
  }
}
