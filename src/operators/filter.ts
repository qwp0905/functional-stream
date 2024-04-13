import { TFilterCallback } from '../@types/callback'
import { ObjectTransform } from '../stream/object'

export const filter = <T>(callback: TFilterCallback<T>) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      try {
        callback(chunk, index++) ? done(null, chunk) : done()
      } catch (err) {
        done(err)
      }
    }
  })
}
