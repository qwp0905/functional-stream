import { StreamLike } from '../@types/stream'
import { TMapCallback } from '../@types/callback'
import { Fs } from '..'
import { Pipeline } from '../observer/pipeline'
import { WaitGroup } from '../utils/waitgroup'

export const mergeAll = <T>(): Pipeline<StreamLike<T>, T> => {
  const wg = new WaitGroup()

  return new Pipeline({
    next(event) {
      wg.add()
      Fs.from(event)
        .tap((e) => this.publish(e))
        .toPromise()
        .then(() => wg.done())
    },
    complete() {
      return wg.wait()
    }
  })
}

export const mergeMap = <T, R>(
  callback: TMapCallback<T, StreamLike<R>>
): Pipeline<T, R> => {
  let index = 0
  const wg = new WaitGroup()

  return new Pipeline({
    next(event) {
      wg.add()
      Fs.from(callback(event, index++))
        .tap((e) => this.publish(e))
        .toPromise()
        .then(() => wg.done())
    },
    complete() {
      return wg.wait()
    }
  })
}
