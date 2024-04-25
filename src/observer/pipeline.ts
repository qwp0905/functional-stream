import { IObserver, Subject } from '.'

export class Pipeline<T, R = T> extends Subject<R> implements IObserver<T> {
  constructor(private readonly observe?: IObserver<T, Pipeline<T, R>>) {
    super()
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
