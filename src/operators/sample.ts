import { Fs, OperatorPipe, StreamLike } from "../index.js"

export const sample = <T, R>(notifier: StreamLike<R>): OperatorPipe<T> => {
  return (source, dest) => {
    const trigger = Fs.from(notifier)
    dest.add(() => trigger.close())

    const unique = Symbol()
    let now: T | typeof unique = unique
    source.watch({
      next(event) {
        now = event
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })

    return trigger
      .filter(() => now !== unique)
      .tap(() => (dest.publish(now as T), (now = unique)))
      .catchErr(dest.abort.bind(dest))
      .lastOne()
  }
}
