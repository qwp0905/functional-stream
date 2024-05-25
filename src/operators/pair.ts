import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const pairwise = <T>(): IPipeline<T, [T, T]> => {
  let prev: T | null = null
  return new Pipeline({
    next(event) {
      if (prev !== null) {
        this.publish([prev, event])
      }

      prev = event
    }
  })
}
