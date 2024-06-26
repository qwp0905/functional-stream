import { Fs } from "../../src/index.js"

describe("repeat", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it("1", async () => {
    const r = Fs.interval(10).take(3).repeat(3).toArray()
    jest.advanceTimersByTime(1000)
    await expect(r).resolves.toStrictEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
  })

  it("2", async () => {
    const interval = 300
    const fn = jest.fn()
    const r = Fs.interval(interval).take(3).repeat(3).tap(fn).toArray()

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
    expect(fn).toHaveBeenLastCalledWith(0, 3)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(1, 4)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(5)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenLastCalledWith(2, 5)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(6)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(fn).toHaveBeenLastCalledWith(0, 6)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(7)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(8)
    expect(fn).toHaveBeenLastCalledWith(1, 7)

    jest.advanceTimersByTime(interval - 1)
    expect(fn).toHaveBeenCalledTimes(8)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(9)
    expect(fn).toHaveBeenLastCalledWith(2, 8)

    await expect(r).resolves.toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2])
    expect(fn).toHaveBeenCalledTimes(9)
    expect(fn).toHaveBeenLastCalledWith(2, 8)
  })
})
