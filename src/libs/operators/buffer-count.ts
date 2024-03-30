import { ObjectTransform } from './transform'

export const bufferCount = <T>(count: number) => {
  let queue: T[] = []
  return new ObjectTransform({
    transform(chunk, _, done) {
      queue.push(chunk)
      if (queue.length < count) {
        return done()
      }
      done(null, queue)
      queue = []
    },
    flush(done) {
      queue.length && this.push(queue)
      done()
    }
  })
}
