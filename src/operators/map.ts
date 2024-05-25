import { TMapCallback, IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const map = <T, R>(callback: TMapCallback<T, R>): IPipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      this.publish(callback(event, index++))
    }
  })
}
