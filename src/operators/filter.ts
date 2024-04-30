import { TFilterCallback } from '../@types/callback.js'
import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const filter = <T>(callback: TFilterCallback<T>): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++) && this.publish(event)
    }
  })
}
