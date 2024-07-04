import { OperatorPipe, IMapCallback } from "../@types/index.js"

export const take = <T>(count: number): OperatorPipe<T> => {
  let index = 0
  return (source, dest) => {
    if (count.lessThan(1)) {
      return dest.commit()
    }
    source.watch({
      next(event) {
        dest.publish(event), (index++).equal(count.subtract(1)) && dest.commit()
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
  }
}

export const takeWhile = <T>(callback: IMapCallback<T, boolean>): OperatorPipe<T> => {
  return (source, dest) => {
    let index = 0
    source.watch({
      next(event) {
        callback(event, index++) ? dest.publish(event) : dest.commit()
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
  }
}
