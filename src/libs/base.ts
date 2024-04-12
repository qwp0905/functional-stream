import { EventEmitter } from 'events'

interface ReaderOptions<T> {
  read(): T | Promise<T>
}

export class Reader<T> {
  protected readonly source = new EventEmitter()
  protected done = false
  protected queue = []

  constructor(private readonly options: ReaderOptions<T>) {
    Promise.resolve()
      .then(async () => {
        let data: T
        do {
          data = await this.read()
        } while (data !== null)
        {
          this.push(data)
        }
      })
      .then(() => this.source.emit('flush'))
      .then(() => this.source.emit('end'))
      .then(() => this.destroy())
  }

  static from<T>(iter: AsyncIterable<T> | Iterable<T>) {
    const s = iter[Symbol.iterator] ? Symbol.iterator : Symbol.asyncIterator
    const i = iter[s]()
    return new Reader({
      read() {
        return new Promise((resolve) => {
          Promise.resolve(i.next()).then(({ value, done }) => {
            if (done) {
              return resolve(null)
            }
            resolve(value)
          })
        })
      }
    })
  }

  async *[Symbol.asyncIterator]() {
    for (let data = await this.read(); data !== null; data = await this.read()) {
      yield data
    }
  }

  push(data: T) {
    if (this.source.listeners('data').length) {
      this.source.emit('data', data)
    } else {
      this.queue.push(data)
    }
  }

  read(): Promise<T> {
    return Promise.resolve(this.options.read.call(this))
  }

  destroy() {
    this.source.removeAllListeners()
    this.done = true
  }

  // pipe<R>(next: Pipe<T, R>) {
  //   for (let data = this.queue.shift(); data !== null; data = this.queue.shift()) {
  //     next.source.emit('data', data)
  //   }
  //   this.source.on('data', (data) => next.source.emit('data', data))
  //   this.source.on('flush', () => next.source.emit('flush'))
  //   this.source.on('end', () => next.source.emit('end'))
  // }
}

// export class Pipe<T, R> extends Reader<R> {
// constructor() {}
// }

// export class Base<T> {
//   protected next: Base<any> = null
//   protected readonly queue = []
//   protected source = new EventEmitter()
//   constructor() {}

//   static from<T>(iter: AsyncIterable<T> | Iterable<T>) {
//     const base = new Base()
//     Promise.resolve()
//       .then(async () => {
//         for await (const data of iter) {
//           base.push(data)
//         }
//       })
//       .then(() => base.close())
//     return base
//   }

//   pipe<R>(next: Base<R>) {
//     if (this.next) {
//       return
//     }
//     this.next = next
//     for (let data = this.queue.shift(); data !== undefined; data = this.queue.shift()) {
//       this.next.push(data)
//     }

//     return next
//   }

//   push(data: T) {
//     if (this.next) {
//       this.next.push(data)
//     } else {
//       this.queue.push(data)
//     }
//   }

//   close() {
//     if (!this.next) {
//       return
//     }

//     return this.next.close()
//   }
// }

// export interface PipeOptions<T, R> {
//   pipe(v: T): R
//   flush?(): any
// }

// export class Pipe<T, R> extends Base<T> {
//   constructor(private readonly options: PipeOptions<T, R>) {
//     super()
//   }

//   push(data: T) {
//     Promise.resolve(this.options.pipe.call(this, data)).then((next) => {
//       if (this.next) {
//         this.next.push(next)
//       } else {
//         this.queue.push(next)
//       }
//     })
//   }

//   close() {
//     Promise.resolve(this.options.flush?.call(this)).then(() => {
//       if (!this.next) {
//         return
//       }
//       return this.next.close()
//     })
//   }
// }

// const b = Base.from(new Array(100).fill(null).map((_, i) => i))
// const p = new Pipe({
//   async pipe(i: number) {
//     await new Promise((r) => setTimeout(r, 1000))
//     console.log(i)
//     return i + 1
//   }
// })
// const p2 = new Pipe({
//   pipe(i: number) {
//     console.log(i)
//     return i + 1
//   }
// })
// b.pipe(p).pipe(p2)
