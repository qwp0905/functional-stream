import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const take = <T>(count: number): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return this.publish(event)
      }
      this.commit()
    }
  })
}
