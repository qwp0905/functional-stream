import { IPipeline, TReduceCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const reduce = <A, C = A>(callback: TReduceCallback<A, C>, seed?: A): IPipeline<C, A> => {
  let index = 0
  return new Pipeline({
    next(event) {
      seed =
        (index.equal(0) && seed === undefined && (event as any)) || callback(seed!, event, index++)
    },
    error(err) {
      this.abort(err)
    },
    complete() {
      this.publish(seed!)
      this.commit()
    }
  })
}
