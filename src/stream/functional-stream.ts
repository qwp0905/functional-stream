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
  fromEvent,
  fromInterval,
  fromIterable,
  fromLoop,
  fromPromise,
  fromReadable,
  fromZip
} from './generators.js'
import { FsInternal } from './internal.js'
import { defaultAjaxClient } from '../ajax/index.js'

export class Fs<T> extends FsInternal<T> implements IFs<T> {
  protected constructor(source: ISubject<T>) {
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
      return fromIterable(like)
    }

    if (isAsyncIterable(like)) {
      return fromAsyncIterable(like)
    }

    if (isReadableStream(like)) {
      return fromReadable(like)
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
    return Fs.generate((subject) => {
      const s = streams.map((e) => Fs.from(e))
      s.forEach((e) => subject.add(() => e.close()))
      return fromIterable(s)
        .mergeAll()
        .tap((e) => subject.publish(e))
        .catchError((err) => subject.abort(err))
        .finalize(() => subject.commit())
        .lastOne()
    })
  }

  static concat<T>(...streams: StreamLike<T>[]): IFs<T> {
    return Fs.generate((subject) => {
      const s = streams.map((e) => Fs.from(e))
      s.forEach((e) => subject.add(() => e.close()))
      return fromIterable(s)
        .concatAll()
        .tap((e) => subject.publish(e))
        .catchError((err) => subject.abort(err))
        .finalize(() => subject.commit())
        .lastOne()
    })
  }

  static range(count: number, start = 0): IFs<number> {
    const end = start.add(count)
    return Fs.loop(
      start,
      (x) => x.lessThan(end),
      (x) => x.add(1)
    )
  }

  static loop<T>(
    initialValue: T,
    condFunc: (x: T) => boolean,
    nextFunc: (x: T) => T | Promise<T>
  ): IFs<T> {
    return fromLoop(initialValue, condFunc, nextFunc)
  }

  static race<T>(...v: StreamLike<T>[]): IFs<T> {
    return Fs.generate((subject) => {
      const s = v.map((e) => Fs.from(e))
      s.forEach((e) => subject.add(() => e.close()))
      let first = false
      return fromIterable(s)
        .mergeMap((e) => {
          if (first) {
            e.close()
            return Fs.empty<T>()
          }

          first = true
          return e
        })
        .tap((e) => subject.publish(e))
        .catchError((err) => subject.abort(err))
        .finalize(() => subject.commit())
        .lastOne()
    })
  }

  static interval(ms: number): IFs<number> {
    return fromInterval(ms)
  }

  static empty<T>(): IFs<T> {
    return Fs.generate((sub) => sub.commit())
  }

  static zip(...v: StreamLike<any>[]) {
    return fromZip(...v)
  }

  static delay(ms: number): IFs<void> {
    return Fs.generate((sub) => {
      const delay = setTimeout(() => {
        sub.publish()
        sub.commit()
      }, ms)
      sub.add(() => delay.unref())
    })
  }

  static get ajax() {
    return defaultAjaxClient
  }
}
