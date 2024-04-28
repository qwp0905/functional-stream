import { Subject } from '../observer/subject'

export class WaitGroup {
  private start = 0
  private end = 0
  private readonly trigger = new Subject<void>()
  private readonly done_flag: Promise<void>

  constructor() {
    this.done_flag = new Promise((resolve) => {
      this.trigger.watch({
        next: () => {
          if (this.start - this.end++ > 1) {
            return
          }

          this.trigger.commit()
          resolve()
        }
      })
    })
  }

  add() {
    this.start++
  }

  done() {
    this.trigger.publish()
  }

  wait(): Promise<void> {
    if (this.start === 0) {
      return Promise.resolve(this.trigger.commit())
    }

    return this.done_flag
  }
}
