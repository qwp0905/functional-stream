import { Readable, Transform, Writable, pipeline } from 'stream'
import { CanBeStream, IStreamObject, IStreamReadOptions, Iter } from '../@types/stream'
import { isAsyncIterable, isIterable } from './functions'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from '../@types/callback'
import { map } from './operators/map'
import { filter } from './operators/filter'
import { tap } from './operators/tap'
import { reduce } from './operators/reduce'
import { take } from './operators/take'
import { skip } from './operators/skip'
import { bufferCount } from './operators/buffer-count'
import { mergeAll, mergeMap } from './operators/merge'
import { concatAll, concatMap } from './operators/concat'
import { finalize } from './operators/finalize'
import { delay } from './operators/delay'
import { ObjectPassThrough } from './operators/transform'

export class StreamObject<T> implements IStreamObject<T> {
  private source: Readable
  private chaining: (Writable | Transform)[] = []
  private end = false

  constructor(stream: Readable) {
    this.source = stream
  }

  static from<T>(stream: CanBeStream<T>): IStreamObject<T> {
    if (stream instanceof StreamObject) {
      return stream
    }

    if (stream instanceof Readable) {
      return new StreamObject(stream)
    }

    if (isAsyncIterable(stream) || isIterable(stream)) {
      return new StreamObject(Readable.from(stream as Iter<T>, { objectMode: true }))
    }

    throw new Error('stream type is not supported')
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

  read({ next, error = () => {}, complete = () => {} }: IStreamReadOptions<T>) {
    const stream = this.toStream()
    stream.on('data', next)
    stream.on('error', error)
    stream.on('close', complete)
  }

  [Symbol.asyncIterator](): AsyncIterator<T, any, undefined> {
    throw new Error('Method not implemented.')
  }

  promise(): Promise<T> {
    return new Promise((resolve, reject) => {
      let result: T
      this.read({
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
      this.read({
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
    return this.pipe(take(count))
  }

  skip(count: number): IStreamObject<T> {
    return this.pipe(skip(count))
  }

  bufferCount(count: number): IStreamObject<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(): IStreamObject<T extends CanBeStream<infer K> ? K : any> {
    const pass = new ObjectPassThrough()
    this.read({
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

  concatAll(): IStreamObject<T extends CanBeStream<infer K> ? K : any> {
    return this.pipe(concatAll())
  }

  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency: number = 5
  ): IStreamObject<R extends Promise<infer K> ? K : R> {
    const pass = new ObjectPassThrough()
    this.read({
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

    return (StreamObject.from(pass) as StreamObject<T>).pipe(
      mergeMap(callback, concurrency)
    )
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
    this.read({
      next(data) {
        pass.push(data)
      },
      error(err) {
        pass.destroy(err)
      },
      complete() {
        StreamObject.from(stream).read({
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
    this.read({
      next(data) {
        pass.push(data)
      },
      async error(err) {
        await callback(err)
        pass.destroy(err)
      },
      complete() {
        pass.end()
      }
    })

    return StreamObject.from(pass)
  }
}
