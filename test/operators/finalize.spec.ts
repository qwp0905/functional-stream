import { Fs } from "../../src/stream/functional-stream.js"

describe("finalize", () => {
  it("1", async () => {
    let i = false
    const cb = jest.fn(() => {
      i = false
    })

    await Fs.range(10)
      .tap(() => (i = true))
      .finalize(cb)
      .lastOne()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(i).toBe(false)
  })

  it("2", async () => {
    const err = new Error("err")
    const fn = jest.fn()
    const r = Fs.range(10)
      .tap((e) => {
        if (e === 3) {
          throw err
        }
      })
      .finalize(fn)
      .lastOne()

    await expect(r).rejects.toThrow(err)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith()
  })
})
