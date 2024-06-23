import { Fs, NotSupportTypeError } from "../../src/index.js"

describe("from", () => {
  it("1", async () => {
    const r = new Promise((rs, rj) => {
      try {
        const rr = Fs.from(1 as any)
        rs(rr)
      } catch (e) {
        rj(e)
      }
    })

    await expect(r).rejects.toThrow(NotSupportTypeError)
  })

  it("2", async () => {
    const rs = new ReadableStream({
      start(con) {
        for (let i = 0; i < 10; i++) {
          con.enqueue(i)
        }
        con.close()
      }
    })

    const r = Fs.from(rs).toArray()
    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("3", async () => {
    const i = {
      async *[Symbol.asyncIterator]() {
        for (let i = 0; i < 10; i++) {
          yield i
        }
      }
    }

    const r = Fs.from(i).toArray()
    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("4", async () => {
    const r = Fs.from(Promise.resolve(10)).toArray()
    await expect(r).resolves.toEqual([10])
  })

  it("4", async () => {
    const r = Fs.from("testest").toArray()
    await expect(r).resolves.toEqual(["t", "e", "s", "t", "e", "s", "t"])
  })

  it("5", async () => {
    const r = Fs.from([1, 2, 3]).toArray()
    await expect(r).resolves.toEqual([1, 2, 3])
  })

  it("6", async () => {
    const m = new Map()
    for (let i = 0; i < 4; i++) {
      m.set(i, i + 10)
    }

    const r = Fs.from(m).toArray()
    await expect(r).resolves.toEqual([
      [0, 10],
      [1, 11],
      [2, 12],
      [3, 13]
    ])
  })
})
