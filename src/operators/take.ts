import { IPipeline, TMapCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const take = <T>(count: number): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      index++
      this.publish(event)
      if (index.equal(count)) {
        this.commit()
      }
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}

export const takeLast = <T>(count: number): IPipeline<T> => {
  const queue: T[] = []
  return new Pipeline({
    next(event) {
      queue.push(event)
      if (queue.length.greaterThan(count)) {
        queue.shift()
      }
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      while (queue.length.greaterThan(0)) {
        this.publish(queue.shift()!)
      }
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
