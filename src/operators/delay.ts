import { Pipeline } from '../observer/pipeline'

export const delay = <T>(ms: number): Pipeline<T> => {
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
    async complete() {
      while (queue.length > 0) {
        await queue.shift()
      }
    }
  })
}
