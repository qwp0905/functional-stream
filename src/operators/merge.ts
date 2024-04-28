import { StreamLike } from '../@types/stream'
import { TMapCallback } from '../@types/callback'
import { Fs } from '..'
import { Pipeline } from '../observer/pipeline'

export const mergeAll = <T>(): Pipeline<StreamLike<T>, T> => {
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
): Pipeline<T, R> => {
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
