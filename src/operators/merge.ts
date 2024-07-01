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
      dest.add(fs.close.bind(fs))

      return fs
        .tap((e) => dest.publish((seed = e)))
        .catchErr(dest.abort.bind(dest))
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
      error: dest.abort.bind(dest),
      complete() {
        completed = true
        runComplete()
      }
    })
  }
}

export const mergeWith = <T>(streams: StreamLike<T>[], concurrency: number): OperatorPipe<T> => {
  return (source, dest) => {
    return Fs.from<StreamLike<T>>(streams)
      .startWith(source)
      .mergeAll(concurrency)
      .tap(dest.publish.bind(dest))
      .catchErr(dest.abort.bind(dest))
      .finalize(dest.commit.bind(dest))
      .lastOne()
  }
}
