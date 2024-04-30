import { IPipeline } from '../@types/observer'
import { Pipeline } from '../observer/pipeline'

export const skip = <T>(count: number): IPipeline<T> => {
  let index = 0

  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return
      }
      this.publish(event)
    }
  })
}
