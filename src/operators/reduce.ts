import { OperatorPipe, TReduceCallback } from '../@types/index.js'

export const reduce = <A, C = A>(callback: TReduceCallback<A, C>, seed?: A): OperatorPipe<C, A> => {
  return (source) => (dest) => {
    let index = 0
    source.watch({
      next(event) {
        seed =
          (index.equal(0) && seed === undefined && (event as any)) ||
          callback(seed!, event, index++)
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
