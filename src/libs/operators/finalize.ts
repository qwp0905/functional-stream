import { TAnyCallback } from '../../@types/callback'
import { ObjectPassThrough } from '../object'

export const finalize = (callback: TAnyCallback) => {
  return new ObjectPassThrough({
    async flush(done) {
      try {
        await callback()
        done()
      } catch (err) {
        done(err)
      }
    }
  })
}
