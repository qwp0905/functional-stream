import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

const unique = Symbol()

export const pairwise = <T>(): IPipeline<T, [T, T]> => {
  let prev: T | typeof unique = unique
  return new Pipeline({
    next(event) {
      if (prev !== unique) {
        this.publish([prev, event])
      }
      prev = event
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
