import { Fs, OperatorPipe, StreamLike } from "../index.js"
import { toAsyncIter } from "../utils/index.js"

export const zipWith = <T>(streams: StreamLike<any>[]): OperatorPipe<T, any[]> => {
  return (source, dest) => {
    const list = streams.map((e) => Fs.from(e))
    list.forEach((e) => dest.add(e.close.bind(e)))

    const iters = [source as AsyncIterable<T>].concat(list).map((e) => toAsyncIter(e))
    const next = () => Promise.all(iters.map((e) => e.next()))

    return Fs.from(next())
      .concatMap((seed) => Fs.loop(seed, (data) => data.some((e) => !e.done), next))
      .map((data) => data.map((e) => e.value))
      .operate({
        destination: dest,
        next: dest.publish.bind(dest),
        error: dest.abort.bind(dest),
        complete: dest.commit.bind(dest)
      })
  }
}
