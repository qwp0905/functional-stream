import { Fs } from "../../src/index.js"

describe("throttle", () => {
  it("1", async () => {
    const r = Fs.interval(10)
      .take(10)
      .throttle(() => Fs.delay(25))
      .toArray()
    await expect(r).resolves.toStrictEqual([0, 3, 6, 9])
  })

  it("2", async () => {
    const r = Fs.interval(10)
      .take(10)
      .throttle(() => Fs.delay(5))
      .toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
