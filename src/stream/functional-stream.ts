import {
  isAsyncIterable,
  isIterable,
  isReadableStream,
  NotSupportTypeError
} from '../utils/index.js'
import { Subject } from '../observer/index.js'
import { ISubject, HtmlEventMap, IFs, StreamLike } from '../@types/index.js'
import {
  fromAsyncIterable,
  fromAsyncIterator,
  fromEvent,
  fromIterable,
  fromPromise,
  fromReadable
} from './generators.js'
import { FsInternal } from './internal.js'
import { defaultAjaxClient } from '../ajax/index.js'

export class Fs<T> extends FsInternal<T> implements IFs<T> {
  constructor(source: ISubject<T>) {
    super(source)
  }

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

  static fromEvent<T extends EventTarget, K extends keyof HtmlEventMap<T>>(
    source: T,
    event: K
  ): IFs<HtmlEventMap<T>[K]>
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

  static readonly ajax = defaultAjaxClient
}
