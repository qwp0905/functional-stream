import { TFilterCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const filter = <T>(callback: TFilterCallback<T>): Pipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++) && this.publish(event)
    }
  })
}
