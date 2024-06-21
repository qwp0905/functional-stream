import { Fs, OperatorPipe, StreamLike } from '../index.js'

export const zipWith = <T>(streams: StreamLike<any>[]): OperatorPipe<T, any[]> => {
  return (source) => async (dest) => {
    const list = streams.map((e) => Fs.from(e))
    list.forEach((e) => dest.add(() => e.close()))

    const iters = [source, ...list].map((e) => e[Symbol.asyncIterator]())
    const next = () => Promise.all(iters.map((e) => e.next()))

    return Fs.loop(
      await next(),
      (data) => data.some((e) => !e.done),
      () => next()
    )
      .map((data) => data.map((e) => e.value))
      .tap((e) => dest.publish(e))
      .catchError((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
