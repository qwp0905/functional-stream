import { IObserver, Subject } from '.'

export class Pipeline<T, R = T> extends Subject<R> implements IObserver<T> {
  constructor(private readonly observe?: IObserver<T, Pipeline<T, R>>) {
    super()
  }

  [Symbol.asyncIterator](): AsyncIterator<R> {
    let is_done = false
    let error: Error | null = null
    const queue: R[] = []
    const promise: [
      (v: IteratorResult<R> | PromiseLike<IteratorResult<R>>) => void,
      (reason: any) => void
    ][] = []

    const handleError = (err: Error) => {
      error = err
      while (promise.length > 0) {
        const [, reject] = promise.shift()!
        reject(err)
      }
    }

    const handleComplete = () => {
      is_done = true
      while (promise.length > 0) {
        const [resolve] = promise.shift()!
        resolve({ value: undefined, done: true })
      }
    }

    this.add({
      next(event) {
        if (promise.length) {
          const [resolve] = promise.shift()!
          resolve({ value: event, done: false })
        } else {
          queue.push(event)
        }
      },
      error: handleError,
      complete: handleComplete
    })

    return {
      async next() {
        if (queue.length) {
          return Promise.resolve({ value: queue.shift()!, done: false })
        }

        if (is_done) {
          return Promise.resolve({ value: undefined, done: true })
        }

        if (error) {
          return Promise.reject(error)
        }

        return new Promise((resolve, reject) => {
          promise.push([resolve, reject])
        })
      },
      throw: (e) => {
        handleError(e)
        return Promise.reject(e)
      },
      return() {
        handleComplete()
        return Promise.resolve({ value: undefined, done: true })
      }
    }
  }

  next(event: T) {
    try {
      this.observe?.next
        ? this.observe.next.call(this, event)
        : this.publish(event as any)
    } catch (err) {
      this.error(err)
    }
  }

  async error(err: Error) {
    try {
      await this.observe?.error?.call(this, err)
      this.abort(err)
    } catch (e) {
      this.abort(e)
    }
  }

  async complete() {
    try {
      await this.observe?.complete?.call(this)
      this.commit()
    } catch (err) {
      this.error(err)
    }
  }

  pipe<K>(pipe: Pipeline<R, K>) {
    this.add(pipe)
    return pipe
  }
}

export function fromIterable<T>(iter: Iterable<T>): Pipeline<T> {
  const subject = new Pipeline<T>()
  Promise.resolve()
    .then(() => {
      for (const data of iter) {
        subject.publish(data)
      }
    })
    .catch((err) => subject.abort(err))
    .finally(() => subject.commit())
  return subject
}

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): Pipeline<T> {
  const subject = new Pipeline<T>()
  Promise.resolve()
    .then(async () => {
      for await (const data of iter) {
        subject.publish(data)
      }
    })
    .catch((err) => subject.abort(err))
    .finally(() => subject.commit())
  return subject
}

export function fromPromise<T>(p: Promise<T>): Pipeline<T> {
  const subject = new Pipeline<T>()
  p.then((data) => subject.publish(data))
    .catch((err) => subject.abort(err))
    .finally(() => subject.commit())
  return subject
}

export function fromReadable<T>(readable: ReadableStream<T>): Pipeline<T> {
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
