import { StreamLike, OperatorPipe, IReduceCallback } from "../@types/index.js"
import { Fs } from "../stream/index.js"

export const mergeScan = <T, R>(
  callback: IReduceCallback<R, T, StreamLike<R>>,
  seed: R,
  concurrency: number
): OperatorPipe<T, R> => {
  return (source, dest) => {
    const buffered: T[] = []
    let activated = 0
    let index = 0
    let completed = false

    const runComplete = () => activated.equal(0) && buffered.length.equal(0) && dest.commit()

    const runNext = (event: T) => {
      activated++
      const fs = Fs.from(callback(seed, event, index++))
      dest.add(() => fs.close())

      return fs
        .tap((e) => dest.publish((seed = e)))
        .catchErr((err) => dest.abort(err))
        .discard()
        .finalize(() => {
          activated--
          while (buffered.length.greaterThan(0) && activated.lessThan(concurrency)) {
            runNext(buffered.shift()!)
          }
          completed && runComplete()
        })
        .lastOne()
    }

    source.watch({
      next(event) {
        concurrency.greaterThan(activated) ? runNext(event) : buffered.push(event)
      },
      error(err) {
        dest.abort(err)
      },
      complete() {
        completed = true
        runComplete()
      }
    })
  }
}

export const mergeWith = <T>(streams: StreamLike<T>[], concurrency: number): OperatorPipe<T> => {
  return (source, dest) => {
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(() => fs.close()))
    return Fs.from<StreamLike<T>>(list)
      .startWith(source)
      .mergeAll(concurrency)
      .tap((e) => dest.publish(e))
      .catchErr((err) => dest.abort(err))
      .finalize(() => dest.commit())
      .lastOne()
  }
}
