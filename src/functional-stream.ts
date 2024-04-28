import { IFs, IStreamReadOptions, StreamLike } from './@types/stream'
import {
  isAsyncIterable,
  isEventSource,
  isHtmlElement,
  isIterable,
  isOnOffEventSource,
  isReadableStream
} from './utils/functions'
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
import { defaultIfEmpty, throwIfEmpty } from './operators/empty'
import { Subject } from './observer/subject'
import { groupBy } from './operators/group'
import { delay } from './operators/delay'
import { Pipeline } from './observer/pipeline'

export class Fs<T> implements IFs<T> {
  constructor(private source: Subject<T>) {}

  static generate<T>(generator: (sub: Subject<T>) => void) {
    const sub = new Subject<T>()
    generator(sub)
    return new Fs(sub)
  }

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

    throw new Error('stream type is not supported')
  }

  static fromEvent<T>(source: any, event: string | symbol): IFs<T> {
    return fromEvent(source, event)
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
    this.source.watch(pipeline)
    const next = this as unknown as Fs<R>
    next.source = pipeline
    return next
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

    return Fs.generate((sub) => {
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

  mergeMap<R>(
    callback: TMapCallback<T, StreamLike<R>>,
    concurrency: number = -1
  ): IFs<R> {
    if (concurrency < 0) {
      return this.pipe(mergeMap(callback))
    }

    return Fs.generate((sub) => {
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

  finalize(callback: TAnyCallback): IFs<T> {
    return Fs.generate((sub) => {
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

    return sub.map((s) => new Fs(s))
  }

  defaultIfEmpty(v: T): IFs<T> {
    return this.pipe(defaultIfEmpty(v))
  }

  throwIfEmpty(err: any): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    return this.pipe(groupBy(callback))
  }
}

function fromIterable<T>(iter: Iterable<T>): IFs<T> {
  return Fs.generate((subject) => {
    Promise.resolve()
      .then(() => {
        for (const data of iter) {
          subject.publish(data)
        }
      })
      .catch((err) => subject.abort(err))
      .finally(() => subject.commit())
  })
}

function fromAsyncIterable<T>(iter: AsyncIterable<T>): IFs<T> {
  return Fs.generate((subject) => {
    Promise.resolve()
      .then(async () => {
        for await (const data of iter) {
          subject.publish(data)
        }
      })
      .catch((err) => subject.abort(err))
      .finally(() => subject.commit())
  })
}

function fromPromise<T>(p: Promise<T>): IFs<T> {
  return Fs.generate((subject) => {
    p.then((data) => subject.publish(data))
      .catch((err) => subject.abort(err))
      .finally(() => subject.commit())
  })
}

function fromReadable<T>(readable: ReadableStream<T>): IFs<T> {
  return fromAsyncIterable({
    async *[Symbol.asyncIterator]() {
      const reader = readable.getReader()
      try {
        for (let data = await reader.read(); !data.done; data = await reader.read()) {
          yield data.value
        }
      } finally {
        reader.releaseLock()
      }
    }
  })
}

function fromEvent<T>(source: any, event: string | symbol): IFs<T> {
  let removeHandler: () => void
  return Fs.generate<T>((sub) => {
    const handler = (...args: any[]) => sub.publish(args.length > 1 ? args : args[0])

    if (isHtmlElement(source)) {
      source.addEventListener(event, handler)
      removeHandler = () => source.removeEventListener(event, handler)
      return
    }

    if (isEventSource(source)) {
      source.addListener(event, handler)
      removeHandler = () => source.removeListener(event, handler)
      return
    }

    if (isOnOffEventSource(source)) {
      source.on(event, handler)
      removeHandler = () => source.off(event, handler)
      return
    }

    throw new Error('invalid event source')
  }).finalize(removeHandler!)
}
