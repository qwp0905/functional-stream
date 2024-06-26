import { OperatorPipe } from "../index.js"

export const startWith = <T>(v: T): OperatorPipe<T> => {
  return (source, dest) => {
    dest.publish(v)
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
