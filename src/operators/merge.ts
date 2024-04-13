import { EventEmitter } from 'events'
import { ObjectTransform } from '../stream/object'
import { StreamObject } from '..'

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
