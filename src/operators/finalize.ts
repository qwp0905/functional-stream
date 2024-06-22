import { OperatorPipe, TAnyCallback } from "../index.js"

export const finalize = <T>(callback: TAnyCallback): OperatorPipe<T> => {
  return (source) => (dest) => {
    source.watch({
      next(event) {
        dest.publish(event)
      },
      error(err) {
        dest.abort(err)
      },
      async complete() {
        await Promise.resolve(callback())
        dest.commit()
      }
    })
  }
}
