import { Fs } from "../../src/index.js"

describe("startWith", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it("1", async () => {
    const r = Fs.range(3).startWith(100).toArray()
    await expect(r).resolves.toStrictEqual([100, 0, 1, 2])
  })

  it("2", async () => {
    const fn = jest.fn()
    const i = 89328
    const r = Fs.interval(i)
      .take(3)
      .map(() => 1)
      .startWith(100)
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(100, 0)
    await jest.advanceTimersByTimeAsync(i - 2)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(1, 2)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(1, 3)

    await jest.runAllTimersAsync()
    await expect(r).resolves.toStrictEqual([100, 1, 1, 1])
    expect(fn).toHaveBeenCalledTimes(4)
  })
})
