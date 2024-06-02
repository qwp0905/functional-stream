import { IPipeline, TMapCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const take = <T>(count: number): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return this.publish(event)
      }
      this.commit()
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}

export const takeWhile = <T>(callback: TMapCallback<T, boolean>): IPipeline<T> => {
  let index = 0

  return new Pipeline({
    next(event) {
      if (callback(event, index++)) {
        return this.publish(event)
      }
      this.commit()
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
