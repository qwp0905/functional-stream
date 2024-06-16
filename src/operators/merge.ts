import { StreamLike, TMapCallback, IPipeline, IFs } from '../@types/index.js'
import { Fs } from '../stream/index.js'
import { Pipeline } from '../observer/index.js'

export const mergeScan = <T, R>(
  callback: (acc: R, cur: T, index: number) => StreamLike<R>,
  initialValue: R
): IPipeline<T, R> => {
  let index = 0
  const queue: IFs<R>[] = []
  return new Pipeline({
    next(event) {
      const fs = Fs.from(callback(initialValue, event, index++))
      this.add(() => fs.close())
      queue.push(fs.tap((e) => this.publish((initialValue = e))))
    },
    error(err) {
      this.abort(err)
    },
    async complete() {
      while (queue.length.greaterThan(0)) {
        await queue.shift()!.lastOne()
      }
      this.commit()
    }
  })
}
