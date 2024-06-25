import { IFs, IFunction1, OrPromise } from "../@types/index.js"
import {
  isEventSource,
  isHtmlElement,
  isOnOffEventSource,
  InvalidEventSourceError,
  toAsyncIter
} from "../utils/index.js"
import { Fs } from "./functional-stream.js"

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): IFs<T> {
  return Fs.new(async (subject) => {
    const iterator = toAsyncIter(iter)
    subject.add(() => iterator.return?.())
    try {
      for (let data = await iterator.next(); !data.done; data = await iterator.next()) {
        subject.publish(data.value)
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
  seed: T,
  cond: IFunction1<T, boolean>,
  next: IFunction1<T, OrPromise<T>>
): IFs<T> {
  return fromAsyncIterable({
    async *[Symbol.asyncIterator]() {
      for (let x = seed; cond(x); x = await next(x)) {
        yield x
      }
    }
  })
}

export function fromPromise<T>(p: Promise<T>): IFs<T> {
  return Fs.new(async (subject) => {
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
  return Fs.new<T>((sub) => {
    const handler = (...args: any[]) => sub.publish(args.length.greaterThan(1) ? args : args.at(0))

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
  return Fs.new((subject) => {
    const timer = setInterval(() => subject.publish(i++), interval)
    subject.add(() => clearInterval(timer))
  })
}

export function fromDelay(ms: number): IFs<void> {
  return Fs.new((subject) => {
    const delay = setTimeout(() => {
      subject.publish()
      subject.commit()
    }, ms)
    subject.add(() => clearTimeout(delay))
  })
}
