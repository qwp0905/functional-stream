import { StreamObject } from '..'
import { TMapCallback } from '../@types/callback'
import { StreamLike } from '../@types/stream'
import { ObjectTransform } from '../stream/object'

export const concatAll = () => {
  return new ObjectTransform({
    transform(chunk, _, done) {
      StreamObject.from(chunk)
        .tap((e) => this.push(e))
        .promise()
        .then(() => done())
    }
  })
}

export const concatMap = <T, R>(callback: TMapCallback<T, StreamLike<R>>) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      StreamObject.from(callback(chunk, index++))
        .tap((e) => this.push(e))
        .promise()
        .then(() => done())
    }
  })
}
