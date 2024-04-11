import { EventEmitter } from 'events'

export class Worker {
  running: Promise<void>[] = []
  event = new EventEmitter()

  constructor(private readonly concurrency: number) {
    this.event.on('data', () => {})
  }

  run(fn: () => Promise<void>) {
    const p = this.concurrency > this.running.length ? null : this.running.shift()
    Promise.resolve(p).then(() => {
      this.running.push(
        new Promise((resolve) => {
          fn().then(() => resolve())
        })
      )
    })
  }

  wait() {
    return Promise.all(this.running)
  }
}

const w = new Worker(3)

for (let i = 0; i < 10; i++) {
  w.run(async () => {
    await new Promise((r) => setTimeout(r, 1000))
    console.log(i)
  })
}
w.wait().then(() => {
  console.log('done')
})
