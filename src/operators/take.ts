import { IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const take = <T>(count: number): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return this.publish(event)
      }
      this.commit()
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
