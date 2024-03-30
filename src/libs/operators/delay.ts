import { ObjectTransform } from './transform'

export const delay = (ms: number) => {
  return new ObjectTransform({
    transform(chunk, _, done) {
      setTimeout(() => done(null, chunk), ms)
    }
  })
}
