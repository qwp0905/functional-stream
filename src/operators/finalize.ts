import { IPipeline, Pipeline, TAnyCallback } from '../index.js'

export const finalize = <T>(callback: TAnyCallback): IPipeline<T> => {
  return new Pipeline({
    next(event) {
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    async complete() {
      await Promise.resolve(callback())
      this.commit()
    }
  })
}
