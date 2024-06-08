import { IPipeline, Pipeline } from '../index.js'

export const timeInterval = <T>(): IPipeline<T, number> => {
  let start: number
  return new Pipeline({
    next() {
      if (start === undefined) {
        start = Date.now()
      } else {
        const now = Date.now()
        this.publish(now - start)
        start = now
      }
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
