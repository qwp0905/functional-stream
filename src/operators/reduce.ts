import { TReduceCallback } from '../@types/callback'
import { Pipeline } from '../observer/pipeline'

export const reduce = <A, C = A>(
  callback: TReduceCallback<A, C>,
  initialValue?: A
): Pipeline<C, A> => {
  let index = 0
  return new Pipeline({
    next(event) {
      initialValue = callback(initialValue || (event as any), event, index++)
    },
    complete() {
      this.publish(initialValue!)
    }
  })
}
