import { StreamLike } from '../@types/stream.js'
import { TMapCallback } from '../@types/callback.js'
import { Fs } from '../stream/functional-stream.js'
import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const mergeAll = <T>(): IPipeline<StreamLike<T>, T> => {
  const queue: Promise<void>[] = []
  return new Pipeline({
    next(event) {
      queue.push(
        Fs.from(event)
          .tap((e) => this.publish(e))
          .toPromise()
          .then()
      )
    },
    async complete() {
      while (queue.length > 0) {
        try {
          await queue.shift()
        } catch (err) {
          return this.abort(err)
        }
      }
    }
  })
}

export const mergeMap = <T, R>(
  callback: TMapCallback<T, StreamLike<R>>
): IPipeline<T, R> => {
  let index = 0
  const queue: Promise<void>[] = []
  return new Pipeline({
    next(event) {
      queue.push(
        Fs.from(callback(event, index++))
          .tap((e) => this.publish(e))
          .toPromise()
          .then()
      )
    },
    async complete() {
      while (queue.length > 0) {
        try {
          await queue.shift()
        } catch (err) {
          return this.abort(err)
        }
      }
    }
  })
}
