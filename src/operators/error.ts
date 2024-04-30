import { TErrorCallback } from '../@types/callback.js'
import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const catchError = <T>(callback: TErrorCallback): IPipeline<T> => {
  return new Pipeline({
    next(event) {
      this.publish(event)
    },
    error(err) {
      return Promise.resolve(callback(err))
    }
  })
}
