import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const bufferCount = <T>(count: number): IPipeline<T, T[]> => {
  let queue: T[] = []
  return new Pipeline({
    next(event) {
      queue.push(event)
      if (queue.length < count) {
        return
      }
      this.publish(queue)
      queue = []
    },
    complete() {
      queue.length && this.publish(queue)
    }
  })
}
