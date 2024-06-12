import { IFs, StreamLike } from '../@types/index.js'
import {
  isEventSource,
  isHtmlElement,
  isOnOffEventSource,
  InvalidEventSourceError
} from '../utils/index.js'
import { Fs } from './functional-stream.js'

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): IFs<T> {
  return Fs.generate(async (subject) => {
    try {
      for await (const data of iter) {
        subject.publish(data)
      }
    } catch (err) {
      subject.abort(err)
    } finally {
      subject.commit()
    }
  })
}

export function fromIterable<T>(iter: Iterable<T>): IFs<T> {
  return fromAsyncIterable({
    async *[Symbol.asyncIterator]() {
      for (const data of iter) {
        yield data
      }
    }
  })
}

export function fromLoop<T>(
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

export function fromPromise<T>(p: Promise<T>): IFs<T> {
  return Fs.generate(async (subject) => {
    try {
      subject.publish(await p)
    } catch (err) {
      subject.abort(err)
    } finally {
      subject.commit()
    }
  })
}

export function fromReadable<T>(readable: ReadableStream<T>): IFs<T> {
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

export function fromEvent<T>(source: any, event: string | symbol): IFs<T> {
  return Fs.generate<T>((sub) => {
    const handler = (...args: any[]) =>
      sub.publish(args.length.greaterThan(1) ? args : args.at(0))

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

export function fromInterval(interval: number): IFs<number> {
  let i = 0
  return Fs.generate((subject) => {
    const timer = setInterval(() => subject.publish(i++), interval)
    subject.add(() => timer.unref())
  })
}

export function fromZip(...v: StreamLike<any>[]): IFs<any[]> {
  const iters = v.map((e) => Fs.from(e)[Symbol.asyncIterator]())
  const next = async () => Promise.all(iters.map((e) => e.next()))

  return fromAsyncIterable({
    async *[Symbol.asyncIterator]() {
      for (let data = await next(); data.some((e) => !e.done); data = await next()) {
        yield data.map((e) => e.value)
      }
    }
  })
}

export function fromDelay(ms: number): IFs<void> {
  return Fs.generate((subject) => {
    const delay = setTimeout(() => {
      subject.publish()
      subject.commit()
    }, ms)
    subject.add(() => delay.unref())
  })
}

export function fromMerge<T>(streams: StreamLike<T>[], concurrency: number = -1): IFs<T> {
  return Fs.generate((subject) => {
    const s = streams.map((e) => Fs.from(e))
    s.forEach((e) => subject.add(() => e.close()))
    return fromIterable(s)
      .mergeAll(concurrency)
      .tap((e) => subject.publish(e))
      .catchError((err) => subject.abort(err))
      .finalize(() => subject.commit())
      .lastOne()
  })
}

export function fromRace<T>(...streams: StreamLike<T>[]): IFs<T> {
  return Fs.generate((subject) => {
    const s = streams.map((e) => Fs.from(e))
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
