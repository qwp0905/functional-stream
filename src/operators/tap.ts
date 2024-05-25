import { IPipeline, TTapCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const tap = <T>(callback: TTapCallback<T>): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++)
      this.publish(event)
    }
  })
}
