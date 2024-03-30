import { TReduceCallback } from '../../@types/callback'
import { ObjectTransform } from './transform'

export const reduce = <A, C>(callback: TReduceCallback<A, C>, initialValue?: A) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      try {
        initialValue = callback(initialValue || chunk, chunk, index++)
        done()
      } catch (err) {}
    },
    flush(done) {
      done(null, initialValue)
    }
  })
}
