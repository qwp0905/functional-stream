import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

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
