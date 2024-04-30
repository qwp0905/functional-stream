import { TMapCallback } from '../@types/callback.js'
import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const map = <T, R>(callback: TMapCallback<T, R>): IPipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      this.publish(callback(event, index++))
    }
  })
}
