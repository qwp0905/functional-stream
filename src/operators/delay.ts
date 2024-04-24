import { Pipeline } from '../observer/pipeline'
import { WaitGroup } from '../utils/waitgroup'

export const delay = <T>(ms: number): Pipeline<T> => {
  const wg = new WaitGroup()
  return new Pipeline({
    next(event) {
      wg.add()
      setTimeout(() => {
        this.publish(event)
        wg.done()
      }, ms)
    },
    complete() {
      return wg.wait()
    }
  })
}
