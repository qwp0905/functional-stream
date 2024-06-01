import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const defaultIfEmpty = <T>(v: T): IPipeline<T> => {
  let is_empty = true
  return new Pipeline({
    next(event) {
      if (is_empty) {
        is_empty = false
      }
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      is_empty && this.publish(v)
      this.commit()
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
    error(err) {
      this.abort(err)
    },
    complete() {
      if (is_empty) {
        this.abort(err)
      } else {
        this.commit()
      }
    }
  })
}
