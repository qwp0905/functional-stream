import { Fs } from "../../src/index.js"

describe("sample", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.interval(100).take(10).sample(Fs.interval(201)).tap(fn).toArray()

    await jest.advanceTimersByTimeAsync(200)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(200)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(3, 1)

    await jest.advanceTimersByTimeAsync(200)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(5, 2)

    await jest.advanceTimersByTimeAsync(200)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(7, 3)

    await jest.runAllTimersAsync()

    await expect(r).resolves.toEqual([1, 3, 5, 7])
    expect(fn).toHaveBeenCalledTimes(4)
  })
})
