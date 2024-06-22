import { OperatorPipe, StreamLike } from '../@types/index.js'
import { Fs } from '../index.js'

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

export const bufferWhen = <T, R>(callback: () => StreamLike<R>): OperatorPipe<T, T[]> => {
  return (source) => (dest) => {
    let queue: T[] = []
    let done = false

    const trigger = Fs.from(callback())
    dest.add(() => trigger.close())

    source.watch({
      next(event) {
        queue.push(event)
      },
      error(err) {
        dest.abort(err)
      },
      complete() {
        done = true
      }
    })

    return trigger
      .tap(() => dest.publish(queue))
      .tap(() => (queue = []))
      .takeWhile(() => !done)
      .catchError((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
