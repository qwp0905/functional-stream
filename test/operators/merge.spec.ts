import { Fs } from "../../src/stream/functional-stream.js"
import { sleep } from "../../src/utils/sleep.js"

describe("merge", () => {
  describe("mergeScan", () => {
    it("1", async () => {
      const r = Fs.range(3)
        .mergeScan<number[]>((acc, cur) => Promise.resolve(acc.concat([cur])), [])
        .toArray()

      await expect(r).resolves.toStrictEqual([[0], [0, 1], [0, 1, 2]])
    })
  })

  describe("mergeAll", () => {
    it("simple1", async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = Fs.from(arr).mergeAll(1).toArray()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it("complex", async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = Fs.from(arr)
        .mergeMap(async (e, i) => {
          await new Promise((r) => setTimeout(r, i * 100))
          return e
        }, 1)
        .mergeAll()
        .toArray()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it("empty", async () => {
      const stream = Fs.from([[]]).mergeAll().toArray()
      await expect(stream).resolves.toEqual([])
    })

    it("empty2", async () => {
      const stream = Fs.from([]).mergeAll().toArray()
      await expect(stream).resolves.toEqual([])
    })

    it("complex 2", async () => {
      const r = Fs.range(10)
        .map((e, i) => new Promise((rs) => setTimeout(() => rs(e), 100 * (10 - i))))
        .mergeAll()
        .toArray()
      await expect(r).resolves.toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    })

    it("1", async () => {
      const r = await Fs.range(5)
        .map((e) => sleep(Math.random() * 100).then(() => e))
        .mergeAll()
        .toArray()

      expect(r).toContain(0)
      expect(r).toContain(1)
      expect(r).toContain(2)
      expect(r).toContain(3)
      expect(r).toContain(4)
      expect(r.length).toEqual(5)
    })
  })

  describe("merge map", () => {
    it("complex 1", async () => {
      const r = Fs.range(10)
        .mergeMap((e, i) => new Promise((rs) => setTimeout(() => rs(e), 100 * (10 - i))))
        .toArray()
      await expect(r).resolves.toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    })
  })

  describe("concat", () => {
    it("1", async () => {
      const r = Fs.range(10)
        .map((e, i) => new Promise((rs) => setTimeout(() => rs(e), 10 * (10 - i))))
        .concatAll()
        .toArray()
      await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it("2", async () => {
      const r = Fs.range(10)
        .concatMap((e, i) => new Promise((rs) => setTimeout(() => rs(e), 10 * (10 - i))))
        .toArray()
      await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it("3", async () => {
      const i = 10000
      const fn = jest.fn()
      jest.useFakeTimers()

      const r = Fs.range(10)
        .bufferCount(3)
        .concatMap((e) => Fs.of(e).delay(i))
        .tap(fn)
        .toArray()

      await jest.advanceTimersByTimeAsync(i - 1)
      expect(fn).not.toHaveBeenCalled()
      await jest.advanceTimersByTimeAsync(1)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenLastCalledWith([0, 1, 2], 0)

      await jest.advanceTimersByTimeAsync(i - 1)
      expect(fn).toHaveBeenCalledTimes(1)
      await jest.advanceTimersByTimeAsync(1)
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenLastCalledWith([3, 4, 5], 1)

      await jest.advanceTimersByTimeAsync(i - 1)
      expect(fn).toHaveBeenCalledTimes(2)
      await jest.advanceTimersByTimeAsync(1)
      expect(fn).toHaveBeenCalledTimes(3)
      expect(fn).toHaveBeenLastCalledWith([6, 7, 8], 2)

      await jest.advanceTimersByTimeAsync(i - 1)
      expect(fn).toHaveBeenCalledTimes(3)
      await jest.advanceTimersByTimeAsync(1)
      expect(fn).toHaveBeenCalledTimes(4)
      expect(fn).toHaveBeenLastCalledWith([9], 3)

      await jest.runAllTimersAsync()
      expect(fn).toHaveBeenCalledTimes(4)
      await expect(r).resolves.toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
      expect(fn).toHaveBeenCalledTimes(4)

      jest.clearAllTimers()
    })

    it("4", async () => {
      const fn = jest.fn()
      const r = Fs.empty()
        .concatMap((e) => Fs.of(e).delay(1000))
        .tap(fn)
        .toArray()

      await expect(r).resolves.toEqual([])
      expect(fn).toHaveBeenCalledTimes(0)
    })
  })
})

describe("mergeWith", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.interval(100)
      .take(3)
      .map(() => 1)
      .mergeWith(
        Fs.interval(151)
          .take(2)
          .map(() => 2)
      )
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(50)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(2, 1)

    await jest.advanceTimersByTimeAsync(48)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(1, 2)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(1, 3)

    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(2, 4)

    await expect(r).resolves.toEqual([1, 2, 1, 1, 2])
  })

  it("2", async () => {
    jest.useRealTimers()
    const r = Fs.of(1).mergeWith(Fs.interval(10)).take(1).lastOne()
    await expect(r).resolves.toEqual(1)
  })
})
