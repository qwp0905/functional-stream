import { StreamLike } from '../@types/stream'
import { TMapCallback } from '../@types/callback'
import { Fs } from '..'
import { Pipeline } from '../observer/pipeline'
import { Subject } from '../observer'

export const mergeAll = <T>(): Pipeline<StreamLike<T>, T> => {
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
    next(event) {
      start++
      Fs.from(event)
        .tap((e) => this.publish(e))
        .toPromise()
        .then(() => trigger.publish())
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

export const mergeMap = <T, R>(
  callback: TMapCallback<T, StreamLike<R>>
): Pipeline<T, R> => {
  let index = 0
  let running = 0
  let is_empty = true
  const trigger = new Subject<void>()
  const is_done = new Promise<void>((resolve) => {
    trigger.add({
      next() {
        running--
        if (running > 0) {
          return
        }

        trigger.commit()
        resolve()
      }
    })
  })

  return new Pipeline({
    next(event) {
      running++
      if (is_empty) {
        is_empty = false
      }

      Fs.from(callback(event, index++))
        .tap((e) => this.publish(e))
        .toPromise()
        .then(() => trigger.publish())
    },
    async complete() {
      if (is_empty) {
        trigger.commit()
        return
      }
      await is_done
      return
    }
  })
}
