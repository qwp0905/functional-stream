import { EventEmitter } from 'events'
import { ObjectTransform } from './transform'
import { StreamObject } from '..'
import { TMapCallback } from '../../@types/callback'

const DONE = Symbol('done')

export const mergeAll = () => {
  let running = 0
  const event = new EventEmitter()
  const is_done = new Promise((resolve) => {
    event.on(DONE, () => {
      if (running > 1) {
        running--
        return
      }

      event.removeAllListeners()
      resolve(null)
    })
  })

  return new ObjectTransform({
    transform(chunk, _, done) {
      StreamObject.from(chunk)
        .tap((e) => this.push(e))
        .promise()
        .then(() => this.emit(DONE))
      done()
    },
    async flush(done) {
      await is_done
      done()
    }
  })
}

export const mergeMap = <T, R>(
  callback: TMapCallback<T, R | Promise<R>>,
  concurrency: number
) => {
  let index = 0
  let running = 0
  let is_empty = true
  const queue = []
  const event = new EventEmitter()
  const is_done = new Promise((resolve) => {
    event.on(DONE, () => {
      if (running > 0 || queue.length > 0) {
        return
      }

      event.removeAllListeners()
      resolve(null)
    })
  })

  return new ObjectTransform({
    async flush(done) {
      if (is_empty) {
        return done()
      }

      await is_done
      done()
    },
    transform(chunk, _, done) {
      if (is_empty) {
        is_empty = false
      }

      running++
      try {
        Promise.resolve(callback(chunk, index++))
          .then((data) => {
            this.push(data)
            running--
            while (queue.length && running < concurrency) {
              const buffered = queue.shift()
              buffered()
            }
            event.emit(DONE)
          })
          .catch((err) => this.destroy(err))

        if (running >= concurrency) {
          queue.push(done)
        } else {
          done()
        }
      } catch (err) {
        done(err)
      }
    }
  })
}
