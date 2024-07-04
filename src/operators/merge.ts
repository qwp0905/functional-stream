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
      activated += 1
      return Fs.from(callback(seed, event, index++)).operate({
        destination: dest,
        next(event) {
          dest.publish((seed = event))
        },
        error: dest.abort.bind(dest),
        finalize() {
          activated -= 1
          while (buffered.length.greaterThan(0) && activated.lessThan(concurrency)) {
            runNext(buffered.shift()!)
          }
          completed && runComplete()
        }
      })
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
    const list = streams.map((s) => Fs.from(s))
    list.forEach((fs) => dest.add(fs.close.bind(fs)))
    return Fs.from<StreamLike<T>>(list)
      .startWith(source)
      .mergeAll(concurrency)
      .operate({
        destination: dest,
        next: dest.publish.bind(dest),
        error: dest.abort.bind(dest),
        complete: dest.commit.bind(dest)
      })
  }
}
