import { Closable, Fs, OperatorPipe, StreamLike } from "../index.js"

export const raceWith = <T>(streams: StreamLike<T>[]): OperatorPipe<T> => {
  return (source, dest) => {
    let first = false
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(fs.close.bind(fs)))

    return Fs.from<Closable<T>>(list)
      .startWith(source)
      .mergeMap((e) => (first ? (e.close(), Fs.empty<T>()) : ((first = true), e)))
      .operate({
        destination: dest,
        next: dest.publish.bind(dest),
        error: dest.abort.bind(dest),
        complete: dest.commit.bind(dest)
      })
  }
}
