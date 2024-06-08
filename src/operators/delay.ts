import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const delay = <T>(ms: number): IPipeline<T> => {
  const queue: Promise<void>[] = []
  return new Pipeline({
    next(event) {
      queue.push(
        new Promise((resolve) => {
          setTimeout(() => {
            this.publish(event)
            resolve()
          }, ms)
        })
      )
    },
    error(err) {
      this.abort(err)
    },
    async complete() {
      while (queue.length.greaterThan(0)) {
        await queue.shift()
      }
      this.commit()
    }
  })
}
