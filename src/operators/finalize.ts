import { OperatorPipe, IFunction0 } from "../index.js"

export const finalize = <T>(callback: IFunction0<void>): OperatorPipe<T> => {
  return (source, dest) => {
    dest.add(callback)
    source.watch({
      next(event) {
        dest.publish(event)
      },
      error(err) {
        dest.abort(err)
      },
      complete() {
        dest.commit()
      }
    })
  }
}
