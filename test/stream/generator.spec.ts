import { fromAsyncIterable, fromPromise, fromReadable } from "../../src/stream/generators.js"

describe("iterator", () => {
  it("1", async () => {
    const r = fromAsyncIterable({
      async *[Symbol.asyncIterator]() {
        for (let i = 0; i < 10; i++) {
          yield i
        }
      }
    }).toArray()

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("2", async () => {
    const err = new Error("123")
    const r = fromAsyncIterable({
      async *[Symbol.asyncIterator]() {
        throw err
      }
    }).lastOne()

    await expect(r).rejects.toThrow(err)
  })
})

describe("readable", () => {
  it("1", async () => {
    const rs = new ReadableStream({
      start(con) {
        for (let i = 0; i < 10; i++) {
          con.enqueue(i)
        }
        con.close()
      }
    })
    const r = fromReadable(rs).toArray()
    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe("promise", () => {
  it("1", async () => {
    const r = fromPromise(Promise.resolve(10)).lastOne()
    await expect(r).resolves.toEqual(10)
  })
})
