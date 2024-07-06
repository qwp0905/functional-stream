import { Fs } from "../../src/index.js"

describe("sequenceEqual", () => {
  it("1", async () => {
    const r = Fs.range(10).sequenceEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).lastOne()
    await expect(r).resolves.toBe(true)
  })

  it("2", async () => {
    const r = Fs.range(10).sequenceEqual([]).lastOne()
    await expect(r).resolves.toBe(false)
  })

  it("3", async () => {
    const r = Fs.range(10).sequenceEqual(Fs.interval(10).take(10)).lastOne()
    await expect(r).resolves.toBe(true)
  })

  it("4", async () => {
    const r = Fs.range(10)
      .sequenceEqual(Fs.range(10, 1), (a, b) => a.add(1) === b)
      .lastOne()
    await expect(r).resolves.toBe(true)
  })

  it("5", async () => {
    const r = Fs.range(10)
      .sequenceEqual(Fs.range(10, 2), (a, b) => a.add(1) === b)
      .lastOne()
    await expect(r).resolves.toBe(false)
  })
})
