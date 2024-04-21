import { TErrorCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const catchError = <T>(callback: TErrorCallback): Pipeline<T> => {
  return new Pipeline({
    next(event) {
      this.publish(event)
    },
    error(err) {
      return Promise.resolve(callback(err))
    }
  })
}
