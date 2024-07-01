import { OperatorPipe } from "../index.js"

export const repeat = <T>(count: number): OperatorPipe<T> => {
  return (source, dest) => {
    const queue: [T, number][] = []
    const start = Date.now()

    source.watch({
      next(event) {
        queue.push([event, Date.now().subtract(start)])
        dest.publish(event)
      },
      error: dest.abort.bind(dest),
      complete() {
        const elapse = Date.now().subtract(start)
        while (queue.length.greaterThan(0)) {
          const [event, ms] = queue.shift()!
          for (let i = 0; i.lessThan(count.subtract(1)); i++) {
            const timer = setTimeout(() => dest.publish(event), ms.add(i.multiply(elapse)))
            dest.add(() => clearTimeout(timer))
          }
        }

        const timer = setTimeout(dest.commit.bind(dest), count.subtract(1).multiply(elapse))
        dest.add(() => clearTimeout(timer))
      }
    })
  }
}
