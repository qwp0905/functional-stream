import { Fs } from "../../src/index.js"

describe("race", () => {
  it("1", async () => {
    const r = Fs.range(1).delay(10).raceWith(Fs.range(3).delay(30), Fs.range(5).delay(50)).toArray()

    await expect(r).resolves.toEqual([0])
  })

  it("2", async () => {
    const cb = jest.fn()
    const r = Fs.interval(10).raceWith(Fs.interval(30).tap(cb)).take(3).toArray()

    await expect(r).resolves.toStrictEqual([0, 1, 2])
    expect(cb).not.toHaveBeenCalled()
  })
})
