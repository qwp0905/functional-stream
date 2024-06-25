import { OperatorPipe, IMapCallback } from "../@types/index.js"

export const take = <T>(count: number): OperatorPipe<T> => {
  let index = 0
  return (source) => (dest) => {
    source.watch({
      next(event) {
        index++
        dest.publish(event)
        if (index.equal(count)) {
          dest.commit()
        }
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

export const takeWhile = <T>(callback: IMapCallback<T, boolean>): OperatorPipe<T> => {
  return (source) => (dest) => {
    let index = 0
    source.watch({
      next(event) {
        if (callback(event, index++)) {
          return dest.publish(event)
        }
        dest.commit()
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
