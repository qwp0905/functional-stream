import { FStream } from '..'
import { TMapCallback } from '../@types/callback'
import { StreamLike } from '../@types/stream'
import { Pipeline } from '../observer/pipeline'

export const concatAll = <T>(): Pipeline<StreamLike<T>, T> => {
  return new Pipeline({
    next(event) {
      return FStream.from(event)
        .tap((e) => this.publish(e))
        .promise()
    }
  })
}

export const concatMap = <T, R>(
  callback: TMapCallback<T, StreamLike<R>>
): Pipeline<T, R> => {
  let index = 0
  return new Pipeline({
    next(event) {
      return FStream.from(callback(event, index++))
        .tap((e) => this.publish(e))
        .promise()
    }
  })
}
