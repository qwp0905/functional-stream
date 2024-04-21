import { Pipeline } from '../observer/pipeline'

export const take = <T>(count: number): Pipeline<T> => {
  let index = 0
  return new Pipeline({
    next(event) {
      if (index++ < count) {
        return this.publish(event)
      }
      this.commit()
    }
  })
}
