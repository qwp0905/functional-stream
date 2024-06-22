import { Fs } from "../../src/index.js"

describe("repeat", () => {
  it("1", async () => {
    const r = Fs.interval(10).take(3).repeat(3).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
  })
})
