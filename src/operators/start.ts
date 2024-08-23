import { OperatorPipe } from "../index.js"

export const startWith = <T>(v: T): OperatorPipe<T> => {
  return (source, dest) => {
    source.watch({
      next: dest.publish.bind(dest),
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
    dest.publish(v)
  }
}
