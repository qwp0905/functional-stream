import { Fs } from "../../src/stream/functional-stream.js"

describe("concatWith", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const result = Fs.range(5).concatWith([5, 6]).toArray()
    await expect(result).resolves.toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it("2", async () => {
    const i = 100
    const r1 = Fs.interval(i).take(5)
    const r2 = Fs.range(3)
      .map((e) => -e)
      .concatWith(r1)
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenNthCalledWith(1, -0, 0)
    expect(fn).toHaveBeenNthCalledWith(2, -1, 1)
    expect(fn).toHaveBeenNthCalledWith(3, -2, 2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(0, 3)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(1, 4)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenLastCalledWith(2, 5)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(6)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(fn).toHaveBeenLastCalledWith(3, 6)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(7)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(8)
    expect(fn).toHaveBeenLastCalledWith(4, 7)

    await expect(r2).resolves.toEqual([-0, -1, -2, 0, 1, 2, 3, 4])
    expect(fn).toHaveBeenCalledTimes(8)
  })
})
