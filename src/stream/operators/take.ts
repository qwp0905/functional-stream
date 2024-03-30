import { ObjectTransform } from './transform'

export const take = (count: number) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      if (index++ < count) {
        done(null, chunk)
      } else {
        this.destroy()
      }
    }
  })
}
