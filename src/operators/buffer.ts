import { OperatorPipe } from '../@types/index.js'

export const bufferCount = <T>(count: number): OperatorPipe<T, T[]> => {
  return (source) => (dest) => {
    let queue: T[] = []
    source.watch({
      next(event) {
        queue.push(event)
        if (queue.length.lessThan(count)) {
          return
        }
        dest.publish(queue)
        queue = []
      },
      error(err) {
        queue.length && dest.publish(queue)
        queue = []
        dest.abort(err)
      },
      complete() {
        queue.length && dest.publish(queue)
        queue = []
        dest.commit()
      }
    })
  }
}
