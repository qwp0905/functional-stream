import { TAnyCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const ifEmpty = <T>(callback: TAnyCallback): Pipeline<T> => {
  let is_empty = true
  return new Pipeline({
    next(event) {
      if (is_empty) {
        is_empty = false
      }
      this.publish(event)
    },
    complete() {
      return Promise.resolve(callback())
    }
  })
}
