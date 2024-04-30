import { TFilterCallback } from '../@types/callback'
import { IPipeline } from '../@types/observer'
import { Pipeline } from '../observer/pipeline'

export const filter = <T>(callback: TFilterCallback<T>): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++) && this.publish(event)
    }
  })
}
