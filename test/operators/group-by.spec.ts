import { Fs } from "../../src/stream/functional-stream.js"

describe("group by", () => {
  it("1", async () => {
    const result = Fs.range(10)
      .groupBy((e) => e % 3)
      .concatMap((e) => e.toArray())
      .toArray()

    await expect(result).resolves.toEqual([
      [0, 3, 6, 9],
      [1, 4, 7],
      [2, 5, 8]
    ])
  })

  it("2", async () => {
    const result = Fs.range(10)
      .groupBy((e) => e)
      .concatAll()
      .toArray()

    await expect(result).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
