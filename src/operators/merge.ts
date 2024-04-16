import { EventEmitter } from 'events'
import { StreamObject } from '..'
import { StreamLike } from '../@types/stream'
import { ObjectTransform } from '../stream/object'
import { TMapCallback } from '../@types/callback'

const DONE = 'done'

export const mergeAll = <T>() => {
  let start = 0
  let end = 0
  let is_empty = true
  const event = new EventEmitter()
  const is_done = new Promise<void>((resolve) => {
    event.on(DONE, () => {
      end++
      if (start > end) {
        return
      }

      event.removeAllListeners()
      resolve()
    })
  })

  return new ObjectTransform({
    transform(chunk: StreamLike<T>, _, done) {
      start++
      if (is_empty) {
        is_empty = false
      }

      StreamObject.from(chunk)
        .tap((e) => this.push(e))
        .promise()
        .then(() => event.emit(DONE))
      done()
    },
    async flush(done) {
      if (is_empty) {
        event.removeAllListeners()
        return done()
      }

      await is_done
      done()
    }
  })
}

export const mergeMap = <T, R>(callback: TMapCallback<T, StreamLike<R>>) => {
  let index = 0
  let running = 0
  let is_empty = true
  const event = new EventEmitter()
  const is_done = new Promise<void>((resolve) => {
    event.on(DONE, () => {
      running--
      if (running > 0) {
        return
      }

      event.removeAllListeners()
      resolve()
    })
  })

  return new ObjectTransform({
    transform(chunk: T, _, done) {
      running++
      if (is_empty) {
        is_empty = false
      }

      StreamObject.from(callback(chunk, index++))
        .tap((e) => this.push(e))
        .promise()
        .then(() => event.emit(DONE))
      done()
    },
    async flush(done) {
      if (is_empty) {
        event.removeAllListeners()
        return done()
      }

      await is_done
      done()
    }
  })
}
