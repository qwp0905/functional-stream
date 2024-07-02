import { IFunction1, OperatorPipe, StreamLike } from "../@types/index.js"
import { Fs } from "../index.js"

export const onErrWith = <T>(callback: IFunction1<unknown, StreamLike<T>>): OperatorPipe<T> => {
  return (source, dest) => {
    source.watch({
      next: dest.publish.bind(dest),
      error(err) {
        Fs.from(callback(err)).operate({
          destination: dest,
          next: dest.publish.bind(dest),
          error: dest.abort.bind(dest),
          complete: dest.commit.bind(dest)
        })
      },
      complete: dest.commit.bind(dest)
    })
  }
}
