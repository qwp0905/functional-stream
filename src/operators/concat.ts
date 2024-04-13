import { StreamObject } from '..'
import { TMapCallback } from '../@types/callback'
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

export const concatMap = <T, R>(callback: TMapCallback<T, R>) => {
  let index = 0
  return new ObjectTransform({
    transform(chunk, _, done) {
      Promise.resolve(callback(chunk, index++))
        .then((out) => done(null, out))
        .catch((err) => done(err))
    }
  })
}
