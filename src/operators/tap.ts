import { TTapCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const tap = <T>(callback: TTapCallback<T>): Pipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++)
      this.publish(event)
    }
  })
}
