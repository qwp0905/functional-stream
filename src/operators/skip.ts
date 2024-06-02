import { IPipeline, TMapCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const skip = <T>(count: number): IPipeline<T> => {
  let index = 0

  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return
      }
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}

export const skipWhile = <T>(callback: TMapCallback<T, boolean>): IPipeline<T> => {
  let index = 0
  let started = false

  return new Pipeline({
    next(event) {
      if (started) {
        return this.publish(event)
      }

      if (callback(event, index++)) {
        return
      }

      started = true
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
