import { IFs, IStreamReadOptions, StreamLike } from './@types/stream.js'
import {
  isAsyncIterable,
  isEventSource,
  isHtmlElement,
  isIterable,
  isOnOffEventSource,
  isReadableStream
} from './utils/functions.js'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './@types/callback.js'
import { map } from './operators/map.js'
import { filter } from './operators/filter.js'
import { tap } from './operators/tap.js'
import { reduce } from './operators/reduce.js'
import { skip } from './operators/skip.js'
import { bufferCount } from './operators/buffer-count.js'
import { take } from './operators/take.js'
import { mergeAll, mergeMap } from './operators/merge.js'
import { catchError } from './operators/error.js'
import { defaultIfEmpty, throwIfEmpty } from './operators/empty.js'
import { Subject } from './observer/subject.js'
import { groupBy } from './operators/group.js'
import { delay } from './operators/delay.js'
import { InvalidEventSourceError, NotSupportTypeError } from './utils/errors.js'
import { IPipeline, ISubject } from './@types/observer.js'

export class Fs<T> implements IFs<T> {
  constructor(private source: ISubject<T>) {}

  static generate<T>(generator: (sub: ISubject<T>) => void) {
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
    source: EventTarget,
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

  finalize(callback: TAnyCallback): IFs<T> {
    return this.pipeTo((sub) => {
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

    return sub.map((s) => this.copyTo(s))
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
  return Fs.generate<T>((sub) => {
    const handler = (...args: any[]) => sub.publish(args.length > 1 ? args : args[0])

    if (isHtmlElement(source)) {
      source.addEventListener(event, handler)
      sub.add(() => source.removeEventListener(event, handler))
      return
    }

    if (isEventSource(source)) {
      source.addListener(event, handler)
      sub.add(() => source.removeListener(event, handler))
      return
    }

    if (isOnOffEventSource(source)) {
      source.on(event, handler)
      sub.add(() => source.off(event, handler))
      return
    }

    throw new InvalidEventSourceError()
  })
}
