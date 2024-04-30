import { IObserver, IPipeline } from '../@types/observer'
import { Subject } from './subject'

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

  async error(err: Error) {
    try {
      await this.observe.error?.call(this, err)
      this.abort(err)
    } catch (e) {
      this.abort(e)
    }
  }

  async complete() {
    try {
      await this.observe.complete?.call(this)
      this.commit()
    } catch (err) {
      this.error(err)
    }
  }
}
