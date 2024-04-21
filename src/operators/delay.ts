import { Pipeline } from '../observer/pipeline'

export const delay = <T>(ms: number): Pipeline<T> => {
  return new Pipeline({
    next(event) {
      setTimeout(() => this.publish(event), ms)
    }
  })
}
