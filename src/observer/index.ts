export class Subject<T> {
  private observer: IObserver<T> = null
  private readonly queue = []
  private end = false

  add(observer: IObserver<T>) {
    this.observer = observer
    while (this.queue.length > 0) {
      const event = this.queue.shift()
      this.observer.next(event)
    }
  }

  publish(event: T) {
    if (this.end) {
      throw new Error()
    }

    if (!this.observer) {
      this.queue.push(event)
      return
    }

    this.observer.next(event)
  }

  commit(err?: Error) {
    if (err) {
      this.observer.error?.call(this.observer, err)
    }

    this.observer.complete?.call(this.observer, this)
    this.end = true
    this.observer = null
  }
}

export interface IObserver<T> {
  next(event: T): any
  error?(err: Error): any
  complete?(): any
}
