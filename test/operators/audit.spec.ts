import { Fs } from "../../src/index.js"

describe("audit", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.interval(1000)
      .take(6)
      .audit(() => Fs.interval(1001))
      .tap(fn)
      .toArray()

    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(2000)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(1999)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3, 1)

    await jest.advanceTimersByTimeAsync(1999)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(5, 2)

    await expect(r).resolves.toEqual([1, 3, 5])
  })
})
