import { Fs, IFs, ISubject, OperatorPipe, StreamLike, Subject } from "../index.js"

export const window = <T, R>(stream: StreamLike<R>): OperatorPipe<T, IFs<T>> => {
  return (source, dest) => {
    let subject: ISubject<T> = new Subject<T>()
    dest.add(subject)
    dest.publish(Fs.from(subject))

    source.watch({
      next(event) {
        subject.publish(event)
      },
      error: dest.abort.bind(dest),
      complete() {
        subject.commit(), dest.commit()
      }
    })

    Fs.from(stream).operate({
      destination: dest,
      next() {
        subject.commit()
        dest.publish(Fs.from((subject = new Subject<T>()))), dest.add(subject)
      },
      error: dest.abort.bind(dest)
    })
  }
}

export const windowCount = <T>(count: number): OperatorPipe<T, IFs<T>> => {
  return (source, dest) => {
    let subject: ISubject<T> = new Subject<T>()
    dest.add(subject)
    dest.publish(Fs.from(subject))
    let published = 0

    source.watch({
      next(event) {
        subject.publish(event)
        if ((published++).lessThan(count.subtract(1))) {
          return
        }
        subject.commit()
        dest.publish(Fs.from((subject = new Subject<T>()))), dest.add(subject)
        published = 0
      },
      error: dest.abort.bind(dest),
      complete() {
        subject.commit(), dest.commit()
      }
    })
  }
}
