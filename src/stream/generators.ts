import { IFs } from '../@types/index.js'
import {
  isEventSource,
  isHtmlElement,
  isOnOffEventSource,
  InvalidEventSourceError
} from '../utils/index.js'
import { toAsyncIter } from '../utils/iterator.js'
import { Fs } from './functional-stream.js'

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): IFs<T> {
  return Fs.generate(async (subject) => {
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
  condFunc: (x: T) => boolean,
  nextFunc: (x: T) => T | Promise<T>
): IFs<T> {
  return fromAsyncIterable({
    async *[Symbol.asyncIterator]() {
      for (let x = seed; condFunc(x); x = await nextFunc(x)) {
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
  return Fs.generate((subject) => {
    const timer = setInterval(() => subject.publish(i++), interval)
    subject.add(() => clearInterval(timer))
  })
}

export function fromDelay(ms: number): IFs<void> {
  return Fs.generate((subject) => {
    const delay = setTimeout(() => {
      subject.publish()
      subject.commit()
    }, ms)
    subject.add(() => clearTimeout(delay))
  })
}
