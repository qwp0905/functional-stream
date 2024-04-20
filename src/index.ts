import { Readable, Transform, Writable } from 'stream'
import { StreamLike, IStreamObject, IStreamReadOptions, Iter } from './@types/stream'
import { isAsyncIterable, isIterable } from './stream/functions'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback,
  TVoidCallback
} from './@types/callback'
import { map } from './operators/map'
import { filter } from './operators/filter'
import { tap } from './operators/tap'
import { reduce } from './operators/reduce'
import { take } from './operators/take'
import { skip } from './operators/skip'
import { bufferCount } from './operators/buffer-count'
import { concatAll, concatMap } from './operators/concat'
import { delay } from './operators/delay'
import { ObjectPassThrough } from './stream/object'
import { ifEmpty } from './operators/empty'
import { mergeAll, mergeMap } from './operators/merge'

export class StreamObject<T> implements IStreamObject<T> {
  private readonly chaining: (Writable | Transform)[] = []
  private end = false

  constructor(private readonly source: Readable) {}

  static of<T>(...values: T[]) {
    return StreamObject.from(values)
  }

  static from<T>(stream: StreamLike<T>): IStreamObject<T> {
    if (stream instanceof StreamObject) {
      return stream as IStreamObject<T>
    }

    if (stream instanceof Readable) {
      return new StreamObject(stream)
    }

    if (isAsyncIterable(stream) || isIterable(stream)) {
      return new StreamObject(Readable.from(stream as Iter<T>, { objectMode: true }))
    }

    if (stream instanceof Promise) {
      const pass = new ObjectPassThrough()
      stream
        .then((data) => pass.push(data))
        .catch((err) => pass.destroy(err))
        .finally(() => pass.end())
      return new StreamObject(pass)
    }

    throw new Error('stream type is not supported')
  }

  static merge<T>(...streams: StreamLike<T>[]): IStreamObject<T> {
    return StreamObject.from(streams).mergeAll()
  }

  static concat<T>(...streams: StreamLike<T>[]): IStreamObject<T> {
    return StreamObject.from(streams).concatAll()
  }

  static range(count: number): IStreamObject<number> {
    return StreamObject.from({
      *[Symbol.iterator]() {
        for (let i = 0; i < count; i++) {
          yield i
        }
      }
    })
  }

  private pipe<R = T>(next: Writable | Transform): IStreamObject<R> {
    if (this.end) {
      throw new Error('stream already ended')
    }

    this.chaining.push(next)
    return this as unknown as StreamObject<R>
  }

  private toStream() {
    const stream = this.chaining.reduce((a, c) => a.pipe(c) as Readable, this.source)
    this.end = true
    return stream
  }

  private iter(): AsyncIterator<T> {
    return this.toStream()[Symbol.asyncIterator]()
  }

  private pipeToNew(): StreamObject<T> {
    const pass = new ObjectPassThrough()
    this.watch({
      next(data) {
        pass.push(data)
      },
      error(err) {
        pass.destroy(err)
      },
      complete() {
        pass.end()
      }
    })

    return StreamObject.from(pass) as StreamObject<T>
  }

  watch({ next, error = () => {}, complete = () => {} }: IStreamReadOptions<T>) {
    const stream = this.toStream()
    stream.on('data', next)
    stream.on('error', error)
    stream.on('close', complete)
  }

  async *[Symbol.asyncIterator]() {
    for await (const data of this.toStream() as Readable) {
      yield data
    }
  }

  promise(): Promise<T> {
    return new Promise((resolve, reject) => {
      let result: T
      this.watch({
        next(data) {
          result = data
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
      const result = []
      this.watch({
        next(data) {
          result.push(data)
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

  map<R>(callback: TMapCallback<T, R>): IStreamObject<R> {
    return this.pipe(map(callback))
  }

  filter(callback: TFilterCallback<T>): IStreamObject<T> {
    return this.pipe(filter(callback))
  }

  tap(callback: TTapCallback<T>): IStreamObject<T> {
    return this.pipe(tap(callback))
  }

  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IStreamObject<A> {
    return this.pipe(reduce(callback, initialValue))
  }

  take(count: number): IStreamObject<T> {
    const pass = new ObjectPassThrough()
    this.pipe(take(count)).watch({
      next(data) {
        pass.push(data)
      },
      error(err) {
        pass.destroy(err)
      },
      complete() {
        pass.end()
      }
    })
    return StreamObject.from(pass)
  }

  skip(count: number): IStreamObject<T> {
    return this.pipe(skip(count))
  }

  bufferCount(count: number): IStreamObject<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(
    concurrency: number = -1
  ): IStreamObject<T extends StreamLike<infer K> ? K : never> {
    if (concurrency < 0) {
      return this.pipeToNew().pipe(mergeAll())
    }

    const pass = new ObjectPassThrough()
    const iter = this.iter()
    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await StreamObject.from(data.value)
            .tap((e) => pass.push(e))
            .promise()
        }
      })
    )
      .catch((err) => pass.destroy(err))
      .finally(() => pass.end())

    return StreamObject.from(pass)
  }

  concatAll(): IStreamObject<T extends StreamLike<infer K> ? K : never> {
    return this.pipe(concatAll())
  }

  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency: number = -1
  ): IStreamObject<R extends StreamLike<infer K> ? K : never> {
    if (concurrency < 0) {
      return this.pipeToNew().pipe(mergeMap(callback as any))
    }

    const pass = new ObjectPassThrough()
    const iter = this.iter()
    let index = 0
    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await StreamObject.from(callback(data.value, index++) as any)
            .tap((e) => pass.push(e))
            .promise()
        }
      })
    )
      .finally(() => pass.end())
      .catch((err) => pass.destroy(err))

    return StreamObject.from(pass)
  }

  concatMap<R>(
    callback: TMapCallback<T, R>
  ): IStreamObject<R extends StreamLike<infer K> ? K : never> {
    return this.pipe(concatMap(callback as any))
  }

  finalize(callback: TVoidCallback): IStreamObject<T> {
    const pass = new ObjectPassThrough()
    this.watch({
      next(data) {
        pass.push(data)
      },
      error(err) {
        pass.destroy(err)
      },
      complete() {
        Promise.resolve(callback())
          .then(() => pass.end())
          .catch((err) => pass.destroy(err))
      }
    })
    return StreamObject.from(pass)
  }

  delay(ms: number): IStreamObject<T> {
    return this.pipe(delay(ms))
  }

  chain(stream: StreamLike<T>): IStreamObject<T> {
    const pass = new ObjectPassThrough()
    this.watch({
      next(data) {
        pass.push(data)
      },
      error(err) {
        pass.destroy(err)
      },
      complete() {
        StreamObject.from(stream).watch({
          next(data) {
            pass.push(data)
          },
          error(err) {
            pass.destroy(err)
          },
          complete() {
            pass.end()
          }
        })
      }
    })

    return StreamObject.from(pass)
  }

  catchError(callback: TErrorCallback): IStreamObject<T> {
    const pass = new ObjectPassThrough()
    this.watch({
      next(data) {
        pass.push(data)
      },
      error(err) {
        Promise.resolve(callback(err))
          .then((e) => {
            if (!e) {
              return
            }
            throw e
          })
          .catch((err) => pass.destroy(err))
      },
      complete() {
        pass.end()
      }
    })

    return StreamObject.from(pass)
  }

  copy(count: number): IStreamObject<T>[] {
    const pass = new Array(count).fill(null).map(() => new ObjectPassThrough())
    this.watch({
      next(data) {
        pass.forEach((s) => s.push(data))
      },
      error(err) {
        pass.forEach((s) => s.destroy(err))
      },
      complete() {
        pass.forEach((s) => s.end())
      }
    })

    return pass.map((s) => StreamObject.from(s))
  }

  ifEmpty(callback: TAnyCallback): IStreamObject<T> {
    return this.pipe(ifEmpty(callback))
  }
}
