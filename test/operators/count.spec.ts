import { Fs } from "../../src/stream/functional-stream.js"

describe("count", () => {
  it("1", async () => {
    const r = Fs.range(10).count().lastOne()
    await expect(r).resolves.toBe(10)
  })
})
