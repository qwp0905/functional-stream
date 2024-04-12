export class Base<T> {
  protected next: Base<any> = null
  protected readonly queue = []
  constructor() {}

  static from<T>(iter: AsyncIterable<T> | Iterable<T>) {
    const base = new Base()
    Promise.resolve()
      .then(async () => {
        for await (const data of iter) {
          base.push(data)
        }
      })
      .then(() => base.close())
    return base
  }

  pipe<R>(next: Base<R>) {
    if (this.next) {
      return
    }
    this.next = next
    for (let data = this.queue.shift(); data !== undefined; data = this.queue.shift()) {
      this.next.push(data)
    }

    return next
  }

  push(data: T) {
    if (this.next) {
      this.next.push(data)
    } else {
      this.queue.push(data)
    }
  }

  close() {
    if (!this.next) {
      return
    }

    return this.next.close()
  }
}

export interface PipeOptions<T, R> {
  pipe(v: T): R
  flush?(): any
}

export class Pipe<T, R> extends Base<T> {
  constructor(private readonly options: PipeOptions<T, R>) {
    super()
  }

  push(data: T) {
    Promise.resolve(this.options.pipe.call(this, data)).then((next) => {
      if (this.next) {
        this.next.push(next)
      } else {
        this.queue.push(next)
      }
    })
  }

  close() {
    Promise.resolve(this.options.flush?.call(this)).then(() => {
      if (!this.next) {
        return
      }
      return this.next.close()
    })
  }
}

const b = Base.from(new Array(100).fill(null).map((_, i) => i))
const p = new Pipe({
  async pipe(i: number) {
    await new Promise((r) => setTimeout(r, 1000))
    console.log(i)
    return i + 1
  }
})
const p2 = new Pipe({
  pipe(i: number) {
    console.log(i)
    return i + 1
  }
})
b.pipe(p).pipe(p2)
