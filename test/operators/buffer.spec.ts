import { Fs } from "../../src/stream/functional-stream.js"

describe("buffer count", () => {
  it("number1", async () => {
    const stream = Fs.range(10).bufferCount(10).toArray()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]])
  })

  it("2", async () => {
    const err = new Error("123123")
    const r = Fs.range(10)
      .tap((_, i) => {
        if (i === 3) {
          throw err
        }
      })
      .bufferCount(3)
      .lastOne()
    await expect(r).rejects.toThrow(err)
  })

  it("number2", async () => {
    const stream = Fs.range(10).bufferCount(3).toArray()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })

  it("buffer count", async () => {
    const result = Fs.range(10).bufferCount(2).toArray()
    await expect(result).resolves.toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9]
    ])
  })

  it("buffer count 2", async () => {
    const result = Fs.range(10).bufferCount(3).toArray()
    await expect(result).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })
})

describe("buffer time", () => {
  const fn = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const bt = 320

    const r = Fs.interval(100).take(10).bufferTime(bt).tap(fn).toArray()

    jest.advanceTimersByTime(bt - 1)
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith([0, 1, 2], 0)

    jest.advanceTimersByTime(bt - 1)
    expect(fn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith([3, 4, 5], 1)

    jest.advanceTimersByTime(bt - 1)
    expect(fn).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith([6, 7, 8], 2)

    jest.advanceTimersByTime(bt - 1)
    expect(fn).toHaveBeenCalledTimes(3)
    jest.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith([9], 3)

    await expect(r).resolves.toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })

  it("2", async () => {
    const err = new Error("123123")
    const r = Fs.range(10)
      .tap((_, i) => {
        if (i === 3) {
          throw err
        }
      })
      .bufferTime(3)
      .lastOne()
    await expect(r).rejects.toThrow(err)
  })
})
