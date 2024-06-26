import { OperatorPipe } from "../index.js"

export const split = (delimiter: string): OperatorPipe<string> => {
  return (source, dest) => {
    let tmp = ""
    source.watch({
      next(event) {
        const lines = tmp.concat(event).split(delimiter)
        tmp = lines.pop() ?? ""
        for (const line of lines) {
          dest.publish(line)
        }
      },
      error(err) {
        dest.abort(err)
      },
      complete() {
        tmp && dest.publish(tmp)
        dest.commit()
      }
    })
  }
}
