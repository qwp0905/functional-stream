import { Fs, IPipeline, Pipeline, StreamLike, TMapCallback } from '../index.js'

export const throttle = <T, R>(callback: (arg: T) => StreamLike<R>): IPipeline<T> => {
  let blocked = false
  return new Pipeline({
    next(event) {
      if (blocked) {
        return
      }

      blocked = true
      this.publish(event)
      Fs.from(callback(event))
        .take(1)
        .tap(() => (blocked = false))
        .lastOne()
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
