import { OperatorPipe, SubscriptionTimeoutError } from "../index.js"

export const timeout = <T>(each: number): OperatorPipe<T> => {
  return (source, dest) => {
    const timer = setTimeout(() => dest.abort(new SubscriptionTimeoutError()), each)
    dest.add(() => clearTimeout(timer))
    source.watch({
      next(event) {
        timer.refresh()
        dest.publish(event)
      },
      error: dest.abort.bind(dest),
      complete: dest.commit.bind(dest)
    })
  }
}
