import { Closable, Fs, OperatorPipe, StreamLike } from "../index.js"

export const raceWith = <T>(streams: StreamLike<T>[]): OperatorPipe<T> => {
  return (source, dest) => {
    let first = false
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(() => fs.close()))

    return Fs.from<Closable<T>>(list)
      .startWith(source)
      .mergeMap((e) => {
        if (first) {
          e.close()
          return Fs.empty<T>()
        }

        first = true
        return e
      })
      .tap((e) => dest.publish(e))
      .catchErr((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
