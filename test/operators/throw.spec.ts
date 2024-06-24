import { Fs } from "../../src/index.js"

describe("throw", () => {
  it("1", async () => {
    const err = new Error("123")
    const r = Fs.throw(err).lastOne()
    await expect(r).rejects.toThrow(err)
  })

  it("2", async () => {
    const err = new Error("123")
    const r = Fs.throw(() => err).lastOne()
    await expect(r).rejects.toThrow(err)
  })
})
