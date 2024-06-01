import { IPipeline, TErrorCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const catchError = <T>(callback: TErrorCallback): IPipeline<T> => {
  return new Pipeline({
    next(event) {
      this.publish(event)
    },
    async error(err) {
      try {
        await callback(err)
        this.commit()
      } catch (e) {
        this.abort(e)
      }
    },
    complete() {
      this.commit()
    }
  })
}
