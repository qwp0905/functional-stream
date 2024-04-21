import { TMapCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const map = <T, R>(callback: TMapCallback<T, R>): Pipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      this.publish(callback(event, index++))
    }
  })
}
