import { Fs } from "../../src/index.js"

describe("window", () => {
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
    const i2 = 3000
    const r = Fs.interval(i)
      .take(7)
      .window(Fs.interval(i2))
      .mergeMap((e, i) => e.tap((o) => fn(o, i)))
      .toArray()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(2, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(3, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(4, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenLastCalledWith(5, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn).toHaveBeenCalledTimes(6)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(fn).toHaveBeenLastCalledWith(6, 2)

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(fn).toHaveBeenCalledTimes(7)
  })
})

describe("windowCount", () => {
  const fn2 = jest.fn()
  const fn1 = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn2.mockClear()
  })

  it("1", async () => {
    fn1.mockImplementation((e, i) => e.tap((o: any) => fn2(o, i)))
    const i = 1000
    const r = Fs.interval(i).take(7).windowCount(3).mergeMap(fn1).toArray()

    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(i - 2)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenLastCalledWith(0, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(3)
    expect(fn2).toHaveBeenLastCalledWith(2, 0)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(4)
    expect(fn2).toHaveBeenLastCalledWith(3, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(5)
    expect(fn2).toHaveBeenLastCalledWith(4, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(2)
    expect(fn2).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(3)
    expect(fn2).toHaveBeenCalledTimes(6)
    expect(fn2).toHaveBeenLastCalledWith(5, 1)

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(fn1).toHaveBeenCalledTimes(3)
    expect(fn2).toHaveBeenCalledTimes(6)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn1).toHaveBeenCalledTimes(3)
    expect(fn2).toHaveBeenCalledTimes(7)
    expect(fn2).toHaveBeenLastCalledWith(6, 2)

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(fn2).toHaveBeenCalledTimes(7)
    expect(fn1).toHaveBeenCalledTimes(3)
  })
})
