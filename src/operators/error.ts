import { OperatorPipe, TErrorCallback } from '../@types/index.js'

export const catchError = <T>(callback: TErrorCallback): OperatorPipe<T> => {
  return (source) => (dest) => {
    source.watch({
      next(event) {
        dest.publish(event)
      },
      async error(err) {
        await Promise.resolve(callback(err))
        dest.commit()
      },
      complete() {
        dest.commit()
      }
    })
  }
}
