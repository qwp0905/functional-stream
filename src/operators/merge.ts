import { StreamLike, TMapCallback, IPipeline } from '../@types/index.js'
import { Fs } from '../stream/index.js'
import { Pipeline } from '../observer/index.js'

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
