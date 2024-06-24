import { Fs } from "../../src/index.js"

describe("scan", () => {
  it("1", async () => {
    const r = Fs.range(3)
      .scan<number[]>((acc, cur) => acc.concat([cur]), [])
      .toArray()

    await expect(r).resolves.toStrictEqual([[0], [0, 1], [0, 1, 2]])
  })

  it("2", async () => {
    const r = Fs.range(5, 1)
      .scan((a, c) => a + c)
      .toArray()
    await expect(r).resolves.toStrictEqual([1, 3, 6, 10, 15])
  })

  it("3", async () => {
    const r = Fs.range(4)
      .scan((a, c) => a + c)
      .toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 3, 6])
  })
})
