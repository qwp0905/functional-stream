import { Readable, Transform, Writable, pipeline } from 'stream'
import { CanBeStream, IStreamObject, IStreamReadOptions, Iter } from './@types/stream'
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
import { take } from './operators/take'
import { skip } from './operators/skip'
import { bufferCount } from './operators/buffer-count'
import { mergeAll } from './operators/merge'
import { concatAll, concatMap } from './operators/concat'
import { finalize } from './operators/finalize'
import { delay } from './operators/delay'
import { ObjectPassThrough } from './stream/object'
import { ifEmpty } from './operators/empty'

export class StreamObject<T> implements IStreamObject<T> {
  private readonly chaining: (Writable | Transform)[] = []
  private end = false

  constructor(private readonly source: Readable) {}

  static from<T>(stream: CanBeStream<T>): IStreamObject<T> {
    if (stream instanceof StreamObject) {
      return stream as IStreamObject<T>
    }

    if (stream instanceof Readable) {
      return new StreamObject(stream)
    }

    if (isAsyncIterable(stream) || isIterable(stream)) {
      return new StreamObject(Readable.from(stream as Iter<T>, { objectMode: true }))
    }

    throw new Error('stream type is not supported')
  }

  static merge<T>(...streams: CanBeStream<T>[]): IStreamObject<T> {
    return StreamObject.from(streams).mergeAll()
  }

  static concat<T>(...streams: CanBeStream<T>[]): IStreamObject<T> {
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
    const stream = this.chaining.length
      ? pipeline(this.source as any, ...(this.chaining as any), () => {})
      : this.source
    this.end = true
    return stream
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

  mergeAll(): IStreamObject<T extends CanBeStream<infer K> ? K : never> {
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

    return (StreamObject.from(pass) as StreamObject<T>).pipe(mergeAll())
  }

  concatAll(): IStreamObject<T extends CanBeStream<infer K> ? K : never> {
    return this.pipe(concatAll())
  }

  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency: number = 5
  ): IStreamObject<R extends Promise<infer K> ? K : R> {
    const pass = new ObjectPassThrough()
    const s = this.toStream()[Symbol.asyncIterator]() as AsyncIterator<T>
    let index = 0
    Promise.all(
      new Array(concurrency).fill(null).map(async () => {
        for (let data = await s.next(); !data.done; data = await s.next()) {
          const r = await callback(data.value, index++)
          pass.push(r)
        }
      })
    )
      .then(() => pass.end())
      .catch((err) => pass.destroy(err))

    return StreamObject.from(pass)
  }

  concatMap<R = T>(
    callback: TMapCallback<T, R>
  ): IStreamObject<R extends Promise<infer K> ? K : R> {
    return this.pipe(concatMap(callback))
  }

  finalize(callback: TAnyCallback): IStreamObject<T> {
    return this.pipe(finalize(callback))
  }

  delay(ms: number): IStreamObject<T> {
    return this.pipe(delay(ms))
  }

  chain(stream: CanBeStream<T>): IStreamObject<T> {
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
      async error(err) {
        try {
          const e = await Promise.resolve(callback(err))
          if (!e) {
            return
          }

          throw e
        } catch (e) {
          pass.destroy(e)
        }
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
