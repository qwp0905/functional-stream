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
    error(err) {
      this.abort(err)
    },
    async complete() {
      while (queue.length > 0) {
        await queue.shift()
      }
      this.commit()
    }
  })
}
