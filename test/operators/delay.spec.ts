import { Fs } from "../../src/index.js"

describe("delay", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.delay(100)
      .map(() => 1)
      .tap(fn)
      .lastOne()

    jest.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await expect(r).resolves.toEqual(1)
  })
})
