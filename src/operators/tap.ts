import { TTapCallback } from '../@types/callback'
import { ObjectTransform } from '../stream/object'

export const tap = <T>(callback: TTapCallback<T>) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      try {
        callback(chunk, index++)
        done(null, chunk)
      } catch (err) {
        done(err)
      }
    }
  })
}
