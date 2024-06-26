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

  it("3", async () => {
    const err = new Error("test")
    const fn = jest.fn()
    const r = Fs.range(10)
      .map((e, i) => {
        if (i === 5) {
          throw err
        }
        return e
      })
      .groupBy((e) => e.remain(3))
      .map((e) => e.catchErr(fn))
      .concatAll()
      .toArray()

    await expect(r).resolves.toEqual([0, 3, 1, 4, 2])
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(err)
  })
})
