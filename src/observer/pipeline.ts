import { IObserver, IPipeline } from '../@types/index.js'
import { Subject } from './subject.js'

export class Pipeline<T, R = T> extends Subject<R> implements IPipeline<T, R> {
  constructor(private readonly observe: IObserver<T, IPipeline<T, R>>) {
    super()
  }

  next(event: T) {
    try {
      this.observe.next.call(this, event)
    } catch (err) {
      this.error(err)
    }
  }

  error(err: unknown) {
    try {
      this.observe.error?.call(this, err)
    } catch (e) {
      this.abort(e)
    }
  }

  complete() {
    try {
      this.observe.complete?.call(this)
    } catch (err) {
      this.error(err)
    }
  }
}
