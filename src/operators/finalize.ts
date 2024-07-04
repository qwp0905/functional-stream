import { OperatorPipe, IFunction0 } from "../index.js"

export const finalize = <T>(callback: IFunction0<void>): OperatorPipe<T> => {
  return (source, dest) => {
    source.watch({
      next: dest.publish.bind(dest),
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest),
      finalize: callback
    })
  }
}
