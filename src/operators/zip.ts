import { Fs, OperatorPipe, StreamLike } from "../index.js"
import { toAsyncIter } from "../utils/iterator.js"

export const zipWith = <T>(streams: StreamLike<any>[]): OperatorPipe<T, any[]> => {
  return (source) => (dest) => {
    const list = streams.map((e) => Fs.from(e))
    list.forEach((e) => dest.add(() => e.close()))

    const iters = [source as AsyncIterable<T>].concat(list).map((e) => toAsyncIter(e))
    const next = () => Promise.all(iters.map((e) => e.next()))

    return Fs.from(next())
      .concatMap((seed) => Fs.loop(seed, (data) => data.some((e) => !e.done), next))
      .map((data) => data.map((e) => e.value))
      .tap((e) => dest.publish(e))
      .catchError((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
