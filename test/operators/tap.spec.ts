import { Fs } from "../../src/stream/functional-stream.js"

describe("tap", () => {
  it("1", async () => {
    let c = 0
    await Fs.range(100)
      .tap(() => c++)
      .lastOne()

    expect(c).toBe(100)
  })
})
