import { TErrorCallback } from '../@types/callback'
import { IPipeline } from '../@types/observer'
import { Pipeline } from '../observer/pipeline'

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
