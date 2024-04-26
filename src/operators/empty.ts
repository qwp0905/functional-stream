import { Pipeline } from '../observer/pipeline'

export const defaultIfEmpty = <T>(v: T): Pipeline<T> => {
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

export const throwIfEmpty = <T>(err: any): Pipeline<T> => {
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
