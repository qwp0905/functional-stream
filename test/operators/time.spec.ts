import { Fs } from "../../src/index.js"

describe("timeInterval", () => {
  const fn = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers({ now: 10 })
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const i = 1000
    const r = Fs.interval(i).take(5).timeInterval().tap(fn).toArray()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1000, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1000, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(1000, 2)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(1000, 3)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(1000, 4)

    await expect(r).resolves.toEqual([1000, 1000, 1000, 1000, 1000])
    expect(fn).toHaveBeenCalledTimes(5)
  })
})