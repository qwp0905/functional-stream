import { Fs } from '../stream/functional-stream.js'
import { TMapCallback } from '../@types/callback.js'
import { IFs } from '../@types/stream.js'
import { Subject } from '../observer/subject.js'
import { Pipeline } from '../observer/pipeline.js'
import { IPipeline } from '../@types/observer.js'

export const groupBy = <T, R>(callback: TMapCallback<T, R>): IPipeline<T, IFs<T>> => {
  const sub_map = new Map<R, Subject<T>>()
  let index = 0
  return new Pipeline({
    next(event) {
      const key = callback(event, index++)
      if (!sub_map.has(key)) {
        const sub = new Subject<T>()
        sub_map.set(key, sub)
        this.publish(Fs.from(sub))
      }

      sub_map.get(key)?.publish(event)
    },
    error(err) {
      for (const sub of sub_map.values()) {
        sub.abort(err)
      }
      sub_map.clear()
    },
    complete() {
      for (const sub of sub_map.values()) {
        sub.commit()
      }
      sub_map.clear()
    }
  })
}
