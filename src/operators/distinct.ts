import { IPipeline, Pipeline, TMapCallback } from '../index.js'

export const distinct = <T, K>(callback: TMapCallback<T, K>): IPipeline<T> => {
  const set = new Set<K>()
  let index = 0
  return new Pipeline({
    next(event) {
      const key = callback(event, index++)
      if (set.has(key)) {
        return
      }

      set.add(key)
      this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
