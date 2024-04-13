import { TAnyCallback } from '../@types/callback'
import { ObjectTransform } from '../stream/object'

export const ifEmpty = (callback: TAnyCallback) => {
  let is_empty = true
  return new ObjectTransform({
    transform(chunk, _, done) {
      if (is_empty) {
        is_empty = false
      }
      done(chunk)
    },
    flush(done) {
      Promise.resolve(callback())
        .then(() => done())
        .catch((err) => done(err))
    }
  })
}
