import { OperatorPipe } from "../index.js"

export const startWith = <T>(v: T): OperatorPipe<T> => {
  return (source, dest) => {
    dest.publish(v)
    source.watch({
      next: dest.publish.bind(dest),
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
  }
}
