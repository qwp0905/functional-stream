import { IPipeline, Pipeline } from '../index.js'

export const timestamp = (): IPipeline<any, number> => {
  const start = Date.now()
  return new Pipeline({
    next() {
      this.publish(Date.now().subtract(start))
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
