import { ObjectTransform } from '../stream/object'

export const skip = (count: number) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      if (index++ < count) {
        done()
      } else {
        done(null, chunk)
      }
    }
  })
}