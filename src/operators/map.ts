import { TMapCallback } from '../@types/callback'
import { IPipeline } from '../@types/observer'
import { Pipeline } from '../observer/pipeline'

export const map = <T, R>(callback: TMapCallback<T, R>): IPipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      this.publish(callback(event, index++))
    }
  })
}
