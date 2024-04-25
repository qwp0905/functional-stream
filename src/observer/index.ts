enum EventKind {
  next,
  error,
  complete
}

type Event<T> = NextEvent<T> | ErrorEvent | CompleteEvent

class NextEvent<T> {
  readonly kind = EventKind.next
  constructor(readonly payload: T) {}
}
class ErrorEvent {
  readonly kind = EventKind.error
  constructor(readonly payload: Error) {}
}
class CompleteEvent {
  readonly kind = EventKind.complete
}

type ResolveFunction<T> = (v: IteratorResult<T> | PromiseLike<IteratorResult<T>>) => void
type RejectFunction = (reason: any) => void

export class Subject<T> {
  private observer: IObserver<T> | null = null
  private queue: Event<T>[] = []
  private end = false

  add(observer: IObserver<T>) {
    this.observer = observer
    while (this.queue.length !== 0) {
      const event = this.queue.shift()!
      switch (event.kind) {
        case EventKind.next:
          this.publish(event.payload)
          continue
        case EventKind.error:
          return this.abort(event.payload)
        case EventKind.complete:
          return this.commit()
      }
    }
  }

  publish(event: T) {
    if (this.end) {
      return
    }

    if (!this.observer) {
      this.queue.push(new NextEvent(event))
      return
    }

    this.observer.next(event)
  }

  abort(err: Error) {
    if (this.end) {
      return
    }

    if (!this.observer) {
      this.queue.push(new ErrorEvent(err))
      return
    }

    this.observer.error?.(err)
    this.clear()
  }

  commit() {
    if (this.end) {
      return
    }

    if (!this.observer) {
      this.queue.push(new CompleteEvent())
      return
    }

    this.observer.complete?.()
    this.clear()
  }

  private clear() {
    this.end = true
    this.observer = null
    this.queue = []
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    let is_done = false
    let error: Error | null = null
    const queue: T[] = []
    const promise: [ResolveFunction<T>, RejectFunction][] = []

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
      next() {
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
      throw(e) {
        handleError(e)
        return Promise.reject(e)
      },
      return() {
        handleComplete()
        return Promise.resolve({ value: undefined, done: true })
      }
    }
  }
}

export interface IObserver<T, R = any> {
  next(this: R, event: T): any
  error?(this: R, err: Error): any
  complete?(this: R): any
}

export function fromIterable<T>(iter: Iterable<T>): Subject<T> {
  const subject = new Subject<T>()
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

export function fromAsyncIterable<T>(iter: AsyncIterable<T>): Subject<T> {
  const subject = new Subject<T>()
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

export function fromPromise<T>(p: Promise<T>): Subject<T> {
  const subject = new Subject<T>()
  p.then((data) => subject.publish(data))
    .catch((err) => subject.abort(err))
    .finally(() => subject.commit())
  return subject
}

export function fromReadable<T>(readable: ReadableStream<T>): Subject<T> {
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
