import { IPipeline, TReduceCallback } from '../@types/index.js'
import { Pipeline } from '../observer/index.js'

export const reduce = <A, C = A>(
  callback: TReduceCallback<A, C>,
  initialValue?: A
): IPipeline<C, A> => {
  let index = 0
  return new Pipeline({
    next(event) {
      initialValue =
        initialValue !== undefined
          ? callback(initialValue, event, index++)
          : (event as any)
    },
    complete() {
      this.publish(initialValue!)
    }
  })
}

export const scan = <A, C = A>(
  callback: TReduceCallback<A, C>,
  initialValue?: A
): IPipeline<C, A> => {
  let index = 0
  return new Pipeline({
    next(event) {
      initialValue =
        initialValue !== undefined
          ? callback(initialValue, event, index++)
          : (event as any)
      this.publish(initialValue!)
    },
    complete() {
      this.publish(initialValue!)
    }
  })
}
