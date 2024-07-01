import { IFilterCallback, OperatorPipe } from "../@types/index.js"

export const filter = <T>(callback: IFilterCallback<T>): OperatorPipe<T> => {
  return (source, dest) => {
    let index = 0
    source.watch({
      next(event) {
        callback(event, index++) && dest.publish(event)
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
  }
}
