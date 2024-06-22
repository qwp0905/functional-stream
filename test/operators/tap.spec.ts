import { Fs } from "../../src/stream/functional-stream.js"

describe("tap", () => {
  it("1", async () => {
    const cb = jest.fn()
    const r = Fs.range(100).tap(cb).lastOne()

    await expect(r).resolves.toBe(99)
    expect(cb).toHaveBeenCalledTimes(100)
  })
})
