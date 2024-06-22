import { TMapCallback, OperatorPipe } from "../@types/index.js"

export const map = <T, R>(callback: TMapCallback<T, R>): OperatorPipe<T, R> => {
  return (source) => (dest) => {
    let index = 0
    source.watch({
      next(event) {
        dest.publish(callback(event, index++))
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
