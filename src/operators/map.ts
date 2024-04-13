import { TMapCallback } from '../@types/callback'
import { ObjectTransform } from '../stream/object'

export const map = <T, R>(callback: TMapCallback<T, R>) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      try {
        done(null, callback(chunk, index++))
      } catch (err) {
        done(err)
      }
    }
  })
}
