import { OperatorPipe } from "../@types/index.js"

export const defaultIfEmpty = <T>(v: T): OperatorPipe<T> => {
  return (source, dest) => {
    let is_empty = true
    source.watch({
      next(event) {
        if (is_empty) {
          is_empty = false
        }
        dest.publish(event)
      },
      error: dest.abort.bind(dest),
      complete() {
        is_empty && dest.publish(v)
        dest.commit()
      }
    })
  }
}

export const throwIfEmpty = <T>(err: any): OperatorPipe<T> => {
  return (source, dest) => {
    let is_empty = true
    source.watch({
      next(event) {
        if (is_empty) {
          is_empty = false
        }
        dest.publish(event)
      },
      error: dest.abort.bind(dest),
      complete() {
        if (is_empty) {
          dest.abort(err)
        } else {
          dest.commit()
        }
      }
    })
  }
}
