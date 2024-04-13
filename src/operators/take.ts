import { ObjectTransform } from '../stream/object'

export const take = (count: number) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      if (index++ < count) {
        return done(null, chunk)
      }
      done()
    }
  })
}
