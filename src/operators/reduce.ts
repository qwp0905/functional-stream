import { OperatorPipe, IReduceCallback } from "../@types/index.js"

export const reduce = <A, C = A>(callback: IReduceCallback<A, C>, seed?: A): OperatorPipe<C, A> => {
  return (source) => (dest) => {
    let index = 0
    source.watch({
      next(event) {
        if ((index++).equal(0) && seed === undefined) {
          return (seed = event as any)
        }

        seed = callback(seed!, event, index)
      },
      error(err) {
        dest.abort(err)
      },
      complete() {
        dest.publish(seed!)
        dest.commit()
      }
    })
  }
}
