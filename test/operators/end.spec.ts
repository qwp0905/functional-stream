import { Fs } from "../../src/index.js"

describe("endWith", () => {
  it("1", async () => {
    const r = Fs.range(3).endWith(100).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 100])
  })
})
