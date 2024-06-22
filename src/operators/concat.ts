import { Fs, OperatorPipe, StreamLike } from "../index.js"

export const concatWith = <T>(streams: StreamLike<T>[]): OperatorPipe<T> => {
  return (source) => async (dest) => {
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(() => fs.close()))

    return Fs.from([source as StreamLike<T>].concat(list))
      .concatAll()
      .tap((e) => dest.publish(e))
      .catchError((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
