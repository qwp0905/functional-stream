import { Fs } from "../../src/index.js"

describe("loop", () => {
  it("1", async () => {
    const cond = jest.fn((x) => x < 20)
    const next = jest.fn((x) => x + 1)
    const r = Fs.loop(10, cond, next).toArray()

    await expect(r).resolves.toStrictEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    expect(cond).toHaveBeenCalledTimes(11)
    expect(next).toHaveBeenCalledTimes(10)
  })

  it("2", async () => {
    const cond = jest.fn((x) => x < 20)
    const next = jest.fn((x) => Promise.resolve(x + 1))
    const r = Fs.loop(10, cond, next).toArray()

    await expect(r).resolves.toStrictEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
    expect(cond).toHaveBeenCalledTimes(11)
    expect(next).toHaveBeenCalledTimes(10)
  })
})
