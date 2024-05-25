import { IFs } from '../@types/index.js'
import {
  isEventSource,
  isHtmlElement,
  isOnOffEventSource,
  InvalidEventSourceError
} from '../utils/index.js'
import { Fs } from './functional-stream.js'

export function fromIterable<T>(iter: Iterable<T>): IFs<T> {
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

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): IFs<T> {
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

export function fromPromise<T>(p: Promise<T>): IFs<T> {
  return Fs.generate((subject) => {
    p.then((data) => subject.publish(data))
      .catch((err) => subject.abort(err))
      .finally(() => subject.commit())
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

export function fromAsyncIterator<T>(iterator: AsyncIterator<T>): IFs<T> {
  return Fs.generate((subject) => {
    Promise.resolve()
      .then(async () => {
        for (let data = await iterator.next(); !data.done; data = await iterator.next()) {
          subject.publish(data.value)
        }
      })
      .catch((err) => subject.abort(err))
      .finally(() => subject.commit())
  })
}

export function fromEvent<T>(source: any, event: string | symbol): IFs<T> {
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
