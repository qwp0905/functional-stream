import { Fs } from "../../src/stream/functional-stream.js"

describe("filter", () => {
  it("1", async () => {
    const r = Fs.range(10)
      .filter((e) => !!(e % 2))
      .toArray()
    await expect(r).resolves.toEqual([1, 3, 5, 7, 9])
  })

  it("2", async () => {
    const r = Fs.range(10)
      .filter((e) => !(e % 2))
      .toArray()
    await expect(r).resolves.toEqual([0, 2, 4, 6, 8])
  })
})
