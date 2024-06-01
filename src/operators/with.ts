import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const startWith = <T>(v: T): IPipeline<T> => {
  let empty = true
  return new Pipeline({
    next(event) {
      if (empty) {
        empty = false
        this.publish(v)
      }

      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      empty && this.publish(v)
      this.commit()
    }
  })
}

export const endWith = <T>(v: T): IPipeline<T> => {
  return new Pipeline({
    next(event) {
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.publish(v)
      this.commit()
    }
  })
}
