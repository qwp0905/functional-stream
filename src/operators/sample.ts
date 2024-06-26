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
      error(err) {
        dest.abort(err)
      },
      complete() {
        dest.commit()
      }
    })

    return trigger
      .filter(() => now !== unique)
      .tap(() => dest.publish(now as T))
      .tap(() => (now = unique))
      .catchError((err) => dest.abort(err))
      .lastOne()
  }
}
