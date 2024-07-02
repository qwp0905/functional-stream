import { IFunction0, OperatorPipe, StreamLike } from "../@types/index.js"
import { Fs } from "../index.js"

export const bufferCount = <T>(count: number): OperatorPipe<T, T[]> => {
  return (source, dest) => {
    let queue: T[] = []
    source.watch({
      next(event) {
        queue.push(event)
        queue.length.greaterThanOrEqual(count) && (dest.publish(queue), (queue = []))
      },
      error(err) {
        dest.abort(err), (queue = [])
      },
      complete() {
        queue.length && dest.publish(queue), dest.commit(), (queue = [])
      }
    })
  }
}

export const bufferWhen = <T, R>(callback: IFunction0<StreamLike<R>>): OperatorPipe<T, T[]> => {
  return (source, dest) => {
    let queue: T[] = []

    source.watch({
      next(event) {
        queue.push(event)
      },
      error(err) {
        dest.abort(err), (queue = [])
      },
      complete() {
        queue.length && dest.publish(queue), dest.commit(), (queue = [])
      }
    })

    return Fs.from(callback()).operate({
      destination: dest,
      next() {
        dest.publish(queue), (queue = [])
      },
      error: dest.abort.bind(dest)
    })
  }
}
