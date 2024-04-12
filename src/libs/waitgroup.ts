export class Worker {
  running: Promise<void>[] = []

  constructor(private readonly concurrency: number) {}

  run(fn: () => Promise<void>) {
    if (this.concurrency > this.running.length) {
      this.running.push(
        new Promise((resolve) => {
          fn().then(() => resolve())
        })
      )
      return
    }

    this.running.shift().then(() => {
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
