import { Fs } from "../../src/index.js"

describe("timeInterval", () => {
  const fn = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
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
    expect(fn).toHaveBeenLastCalledWith({ value: 0, interval: 1000 }, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith({ value: 1, interval: 1000 }, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith({ value: 2, interval: 1000 }, 2)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith({ value: 3, interval: 1000 }, 3)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith({ value: 4, interval: 1000 }, 4)

    await expect(r).resolves.toStrictEqual([
      { value: 0, interval: 1000 },
      { value: 1, interval: 1000 },
      { value: 2, interval: 1000 },
      { value: 3, interval: 1000 },
      { value: 4, interval: 1000 }
    ])
    expect(fn).toHaveBeenCalledTimes(5)
  })
})
