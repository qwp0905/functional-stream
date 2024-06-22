import { Fs } from "../../src/index.js"

describe("some", () => {
  it("1", async () => {
    const callback = jest.fn().mockImplementation((e) => e > 3)
    const r = Fs.range(100).some(callback).lastOne()
    await expect(r).resolves.toBe(true)
    expect(callback).toHaveBeenCalledTimes(5)
  })

  it("2", async () => {
    const r = Fs.range(10)
      .some((e) => e.greaterThan(100))
      .lastOne()
    await expect(r).resolves.toBe(false)
  })
})
