import { IFunction1, OperatorPipe, StreamLike } from "../@types/index.js"
import { Fs } from "../index.js"

export const catchError = <T>(callback: IFunction1<unknown, StreamLike<T>>): OperatorPipe<T> => {
  return (source, dest) => {
    source.watch({
      next(event) {
        dest.publish(event)
      },
      async error(err) {
        try {
          const fs = Fs.from(callback(err))
          dest.add(() => fs.close())
          await fs.tap((e) => dest.publish(e)).lastOne()
          dest.commit()
        } catch (error) {
          dest.abort(error)
        }
      },
      complete() {
        dest.commit()
      }
    })
  }
}
