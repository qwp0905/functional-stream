import { Fs, OperatorPipe, StreamLike } from "../index.js"

export const sample = <T, R>(notifier: StreamLike<R>): OperatorPipe<T> => {
  return (source, dest) => {
    const unique = Symbol()
    let now: T | typeof unique = unique
    source.watch({
      next(event) {
        now = event
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })

    return Fs.from(notifier).operate({
      destination: dest,
      next() {
        now !== unique && dest.publish(now as T), (now = unique)
      },
      error: dest.abort.bind(dest)
    })
  }
}
