import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const defaultIfEmpty = <T>(v: T): IPipeline<T> => {
  let is_empty = true
  return new Pipeline({
    next(event) {
      if (is_empty) {
        is_empty = false
      }
      this.publish(event)
    },
    complete() {
      is_empty && this.publish(v)
    }
  })
}

export const throwIfEmpty = <T>(err: any): IPipeline<T> => {
  let is_empty = true
  return new Pipeline({
    next(event) {
      if (is_empty) {
        is_empty = false
      }
      this.publish(event)
    },
    complete() {
      is_empty && this.abort(err)
    }
  })
}
