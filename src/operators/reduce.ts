import { OperatorPipe, IReduceCallback } from "../@types/index.js"

export interface ReduceOptions<A, C> {
  callback: IReduceCallback<A, C>
  seed?: A
  emitOnEnd: boolean
  emitNext: boolean
}

export const reduce = <A, C = A>(options: ReduceOptions<A, C>): OperatorPipe<C, A> => {
  return (source, dest) => {
    let index = 0
    let hasSeed = options.seed !== undefined
    let state = options.seed
    source.watch({
      next(event) {
        const i = index++
        state = hasSeed ? options.callback(state!, event, i) : ((hasSeed = true), event as any)
        options.emitNext && dest.publish(state!)
      },
      error: dest.abort.bind(dest),
      complete() {
        options.emitOnEnd && dest.publish(state!), dest.commit()
      }
    })
  }
}
