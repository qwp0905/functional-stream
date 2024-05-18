import { IObserver, ISubject } from '../@types/observer.js'
import { AlreadySubscribedError } from '../utils/errors.js'

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
  constructor(readonly payload: unknown) {}
}
class CompleteEvent {
  readonly kind = EventKind.complete
}

type ResolveFunction<T> = (v: IteratorResult<T> | PromiseLike<IteratorResult<T>>) => void
type RejectFunction = (reason: any) => void

export class Subject<T> implements ISubject<T> {
  private observer: IObserver<T> | null = null
  private queue: Event<T>[] = []
  private end = false
  private readonly finalizers: Set<(() => void) | ISubject<any>> = new Set()

  watch(observer: IObserver<T>) {
    if (this.observer) {
      throw new AlreadySubscribedError()
    }

    this.observer = observer
    Promise.resolve().then(() => {
      while (this.queue.length > 0) {
        const event = this.queue.shift()!
        switch (event.kind) {
          case EventKind.next:
            this._next(event.payload)
            continue
          case EventKind.error:
            return this._error(event.payload)
          case EventKind.complete:
            return this._complete()
        }
      }
    })
  }

  private _next(event: T) {
    try {
      this.observer!.next(event)
    } catch (err) {
      this._error(err)
    }
  }

  private _error(err: unknown) {
    try {
      this.observer!.error?.(err)
    } catch (error) {
      this.observer!.error?.(error)
    } finally {
      this.unwatch()
    }
  }

  private _complete() {
    try {
      this.observer!.complete?.()
    } catch (err: unknown) {
      this.observer!.error?.(err)
    } finally {
      this.unwatch()
    }
  }

  publish(event: T) {
    if (this.end) {
      return
    }

    if (!this.observer || this.queue.length > 0) {
      this.queue.push(new NextEvent(event))
      return
    }

    return this._next(event)
  }

  abort(err: unknown) {
    if (this.end) {
      return
    }

    if (!this.observer || this.queue.length > 0) {
      this.queue.push(new ErrorEvent(err))
      return
    }

    return this._error(err)
  }

  commit() {
    if (this.end) {
      return
    }

    if (!this.observer || this.queue.length > 0) {
      this.queue.push(new CompleteEvent())
      return
    }

    return this._complete()
  }

  add<R>(fn: (() => void) | ISubject<R>) {
    this.finalizers.add(fn)
  }

  private unwatch() {
    this.end = true
    this.observer = null
    this.queue = []
    for (const finalizer of this.finalizers.values()) {
      this.finalizers.delete(finalizer)
      if (typeof finalizer === 'function') {
        finalizer()
      } else {
        finalizer.commit()
      }
    }
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

    this.watch({
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
        this.unwatch()
        handleError(e)
        return Promise.reject(e)
      },
      return: () => {
        this.unwatch()
        handleComplete()
        return Promise.resolve({ value: undefined, done: true })
      }
    }
  }
}
