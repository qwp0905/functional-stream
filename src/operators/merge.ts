import { StreamLike, IFs, OperatorPipe, IReduceCallback } from "../@types/index.js"
import { Fs } from "../stream/index.js"
import { toAsyncIter } from "../utils/index.js"

export const mergeScan = <T, R>(
  callback: IReduceCallback<R, T, StreamLike<R>>,
  seed: R,
  concurrency: number
): OperatorPipe<T, R> => {
  if (concurrency.greaterThan(0) && concurrency.isFinite()) {
    return (source) => (dest) => {
      let index = 0
      const iter = toAsyncIter(source)
      return Fs.range(concurrency)
        .mergeMap(async () => {
          for (let data = await iter.next(); !data.done; data = await iter.next()) {
            const fs = Fs.from(callback(seed, data.value, index++))
            dest.add(() => fs.close())
            await fs.tap((e) => dest.publish((seed = e))).lastOne()
          }
        })
        .discard()
        .catchError((err) => dest.abort(err))
        .finalize(() => dest.commit())
        .lastOne()
    }
  }

  return (source) => (dest) => {
    const queue: IFs<R>[] = []
    let index = 0
    source.watch({
      next(event) {
        const fs = Fs.from(callback(seed, event, index++))
        dest.add(() => fs.close())
        queue.push(
          fs
            .tap((e) => dest.publish((seed = e)))
            .catchError((err) => dest.abort(err))
            .discard()
        )
      },
      error(err) {
        dest.abort(err)
      },
      async complete() {
        while (queue.length.greaterThan(0)) {
          await queue.shift()!.lastOne()
        }
        dest.commit()
      }
    })
  }
}

export const mergeWith = <T>(streams: StreamLike<T>[], concurrency: number): OperatorPipe<T> => {
  return (source) => (dest) => {
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(() => fs.close()))
    return Fs.from<StreamLike<T>>(list)
      .startWith(source)
      .mergeAll(concurrency)
      .tap((e) => dest.publish(e))
      .catchError((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
