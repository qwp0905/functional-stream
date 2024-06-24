import { Fs } from "../../src/index.js"

describe("reduce", () => {
  it("1", async () => {
    const r = Fs.range(10)
      .reduce((a, b) => a + b)
      .lastOne()
    await expect(r).resolves.toEqual(45)
  })

  it("2", async () => {
    const r = Fs.range(10)
      .reduce((a, b) => a + b, 1)
      .lastOne()
    await expect(r).resolves.toEqual(46)
  })
})
