import { StreamObject } from '..'
import { TMapCallback } from '../../@types/callback'
import { ObjectTransform } from './transform'

export const concatAll = () => {
  return new ObjectTransform({
    async transform(chunk, _, done) {
      await StreamObject.from(chunk)
        .tap((e) => this.push(e))
        .promise()
      done()
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
