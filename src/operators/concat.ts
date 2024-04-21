import { FStream } from '..'
import { TMapCallback } from '../@types/callback'
import { StreamLike } from '../@types/stream'
import { Subject } from '../observer'
import { Pipeline } from '../observer/pipeline'

export const concatAll = <T>(): Pipeline<StreamLike<T>, T> => {
  const queue: (() => void)[] = []
  let start = 0
  let end = 0
  const trigger = new Subject<void>()
  const is_done = new Promise<void>((resolve) => {
    trigger.add({
      next() {
        end++
        if (start > end) {
          return
        }

        trigger.commit()
        resolve()
      }
    })
  })

  return new Pipeline({
    async next(event) {
      if (start++ !== 0) {
        await new Promise<void>((resolve) => {
          queue.push(resolve)
        })
      }

      await FStream.from(event)
        .tap((e) => this.publish(e))
        .promise()

      queue.shift()?.()
      trigger.publish()
    },
    async complete() {
      if (!start) {
        trigger.commit()
        return
      }

      await is_done
      return
    }
  })
}

export const concatMap = <T, R>(
  callback: TMapCallback<T, StreamLike<R>>
): Pipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      return FStream.from(callback(event, index++))
        .tap((e) => this.publish(e))
        .promise()
    }
  })
}
