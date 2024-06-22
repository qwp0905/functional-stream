import { fromAsyncIterable } from "../../src/stream/generators.js"

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
})
