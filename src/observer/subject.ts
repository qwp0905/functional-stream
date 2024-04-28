import { IObserver } from '../@types/observer'

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
      throw: (e) => {
        this.clear()
        handleError(e)
        return Promise.reject(e)
      },
      return: () => {
        this.clear()
        handleComplete()
        return Promise.resolve({ value: undefined, done: true })
      }
    }
  }
}
