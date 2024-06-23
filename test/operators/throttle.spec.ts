import { Fs } from "../../src/index.js"

describe("throttle", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.interval(10)
      .take(10)
      .throttle(() => Fs.delay(26))
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(9)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    await jest.advanceTimersByTimeAsync(26)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(3)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3, 1)

    await jest.advanceTimersByTimeAsync(26)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(3)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(6, 2)

    await jest.advanceTimersByTimeAsync(26)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(3)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(9, 3)

    await jest.runAllTimersAsync()
    expect(fn).toHaveBeenCalledTimes(4)

    await expect(r).resolves.toStrictEqual([0, 3, 6, 9])
    expect(fn).toHaveBeenCalledTimes(4)
  })

  it("2", async () => {
    const r = Fs.interval(10)
      .take(10)
      .throttle(() => Fs.delay(5))
      .toArray()

    await jest.runAllTimersAsync()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
