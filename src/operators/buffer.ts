import { IFunction0, OperatorPipe, StreamLike } from "../@types/index.js"
import { Fs } from "../index.js"

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
        dest.abort(err)
        queue = []
      },
      complete() {
        queue.length && dest.publish(queue)
        dest.commit()
        queue = []
      }
    })
  }
}

export const bufferWhen = <T, R>(callback: IFunction0<StreamLike<R>>): OperatorPipe<T, T[]> => {
  return (source) => (dest) => {
    let queue: T[] = []

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
        queue.length && dest.publish(queue)
        dest.commit()
        queue = []
      }
    })

    return trigger
      .tap(() => dest.publish(queue))
      .tap(() => (queue = []))
      .catchError((err) => dest.abort(err))
      .lastOne()
  }
}
