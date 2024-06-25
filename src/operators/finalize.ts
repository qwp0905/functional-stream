import { OperatorPipe, TAnyCallback } from "../index.js"

export const finalize = <T>(callback: TAnyCallback): OperatorPipe<T> => {
  return (source) => (dest) => {
    source.watch({
      next(event) {
        dest.publish(event)
      },
      async error(err) {
        await Promise.resolve(callback())
        dest.abort(err)
      },
      async complete() {
        await Promise.resolve(callback())
        dest.commit()
      }
    })
  }
}
