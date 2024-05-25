import { IPipeline } from '../@types/observer.js'
import { Pipeline } from '../observer/pipeline.js'

export const split = (delimiter: string): IPipeline<string> => {
  let tmp = ''
  return new Pipeline({
    next(event) {
      const lines = (tmp + event).split(delimiter)
      tmp = lines.pop()!
      for (const line of lines) {
        this.publish(line)
      }
    },
    complete() {
      tmp && this.publish(tmp)
    }
  })
}
