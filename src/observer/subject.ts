import {
  IFunction0,
  IObserver,
  ISubject,
  RejectFunction,
  ResolveFunction
} from "../@types/index.js"

export class Subject<T> implements ISubject<T> {
  private observers: IObserver<T>[] = []
  private end = false
  private readonly finalizers: Set<(() => void) | ISubject<any>> = new Set()

  watch(observer: IObserver<T>) {
    this.observers.push(observer)
  }

  private _publish(event: T) {
    for (const observer of this.observers) {
      try {
        observer.next(event)
      } catch (e) {
        observer.error?.(e)
      }
    }
  }

  private _abort(err: unknown) {
    for (const observer of this.observers) {
      try {
        observer.error?.(err)
      } catch (e) {
        observer.error?.(e)
      }
    }
    this._close()
  }

  private _commit() {
    for (const observer of this.observers) {
      try {
        observer.complete?.()
      } catch (e) {
        observer.error?.(e)
      }
    }
    this._close()
  }

  private _close() {
    this.end = true
    const observers = this.observers
    this.observers.length = 0
    // this.queue.length = 0
    for (const finalizer of this.finalizers.values()) {
      this.finalizers.delete(finalizer)
      if (typeof finalizer === "function") {
        finalizer()
      } else {
        finalizer.commit()
      }
    }
    for (const ob of observers) {
      ob.finalize?.()
    }
    // observer?.finalize?.()
  }

  publish(event: T) {
    if (this.end) {
      return
    }

    return this._publish(event)
  }

  abort(err: unknown) {
    if (this.end) {
      return
    }

    return this._abort(err)
  }

  commit() {
    if (this.end) {
      return
    }

    return this._commit()
  }

  add<R>(fn: IFunction0<void> | ISubject<R>) {
    this.finalizers.add(fn)
  }

  close() {
    if (this.end) {
      return
    }

    if (!this.observers.length) {
      return this._close()
    }

    return this._commit(), this._close()
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    let is_done = false
    let error: Error | null = null
    const queue: T[] = []
    const promise: [ResolveFunction<IteratorResult<T>>, RejectFunction][] = []

    const handleError = (err: Error) => {
      error = err
      while (promise.length.greaterThan(0)) {
        const [, reject] = promise.shift()!
        reject(err)
      }
    }

    const handleComplete = () => {
      is_done = true
      while (promise.length.greaterThan(0)) {
        const [resolve] = promise.shift()!
        resolve({ value: undefined, done: true })
      }
    }

    this.watch({
      next(event) {
        if (promise.length.greaterThan(0)) {
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
        if (queue.length.greaterThan(0)) {
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
      return: () => {
        handleComplete()
        return Promise.resolve({ value: undefined, done: true })
      }
    }
  }
}
