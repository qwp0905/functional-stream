import { TFilterCallback, IPipeline } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const filter = <T>(callback: TFilterCallback<T>): IPipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      callback(event, index++) && this.publish(event)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.commit()
    }
  })
}
