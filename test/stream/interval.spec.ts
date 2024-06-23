import { Fs } from "../../src/index.js"

describe("interval", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const interval = 100

    const r = Fs.interval(interval).take(3).tap(fn).toArray()

    jest.advanceTimersByTime(interval - 1)
    expect(fn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 1)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(2, 2)

    await expect(r).resolves.toStrictEqual([0, 1, 2])
  })

  it("2", async () => {
    const interval = 200
    const r = Fs.interval(interval).take(10).tap(fn).toArray()

    jest.advanceTimersByTime(interval - 1)
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 1)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(2, 2)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(3, 3)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(4, 4)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(5)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenLastCalledWith(5, 5)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(6)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(fn).toHaveBeenLastCalledWith(6, 6)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(7)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(8)
    expect(fn).toHaveBeenLastCalledWith(7, 7)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(8)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(9)
    expect(fn).toHaveBeenLastCalledWith(8, 8)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(9)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(10)
    expect(fn).toHaveBeenLastCalledWith(9, 9)

    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("3", async () => {
    jest.useRealTimers()
    const r = Fs.interval(10).startWith(100).take(1).toArray()
    await expect(r).resolves.toStrictEqual([100])
  })
})
