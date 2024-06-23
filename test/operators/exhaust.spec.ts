import { Fs } from "../../src/stream/functional-stream.js"
import { sleep } from "../../src/utils/sleep.js"

describe("exhaust", () => {
  const fn = jest.fn()
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    fn.mockClear()
  })

  it("1", async () => {
    const r = Fs.new((sub) => {
      Promise.resolve().then(async () => {
        sub.publish(Fs.range(10).concatMap((e) => sleep(100).then(() => e)))
        sub.publish(Fs.range(10))
        await sleep(1500)
        sub.publish(Fs.range(3))
        sub.commit()
      })
    })
      .exhaustAll()
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 1)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(2, 2)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)
    expect(fn).toHaveBeenLastCalledWith(3, 3)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(4)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(5)
    expect(fn).toHaveBeenLastCalledWith(4, 4)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(5)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenLastCalledWith(5, 5)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(6)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(7)
    expect(fn).toHaveBeenLastCalledWith(6, 6)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(7)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(8)
    expect(fn).toHaveBeenLastCalledWith(7, 7)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(8)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(9)
    expect(fn).toHaveBeenLastCalledWith(8, 8)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(9)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(10)
    expect(fn).toHaveBeenLastCalledWith(9, 9)

    jest.advanceTimersByTime(1499)
    expect(fn).toHaveBeenCalledTimes(10)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(13)
    expect(fn).toHaveBeenNthCalledWith(11, 0, 10)
    expect(fn).toHaveBeenNthCalledWith(12, 1, 11)
    expect(fn).toHaveBeenNthCalledWith(13, 2, 12)

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2])
    expect(fn).toHaveBeenCalledTimes(13)
  })

  it("2", async () => {
    const r = Fs.new((s) => {
      s.publish(
        Fs.interval(100)
          .take(3)
          .map(() => 1)
      )
      setTimeout(() => {
        s.publish(
          Fs.interval(200)
            .take(3)
            .map(() => 2)
        )
      }, 150)
      setTimeout(() => {
        s.publish(Fs.range(3).map(() => 3))
        s.commit()
      }, 350)
    })
      .exhaustAll()
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(1, 0)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith(1, 1)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(2)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(fn).toHaveBeenLastCalledWith(1, 2)

    await jest.advanceTimersByTimeAsync(49)
    expect(fn).toHaveBeenCalledTimes(3)
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(6)
    expect(fn).toHaveBeenNthCalledWith(4, 3, 3)
    expect(fn).toHaveBeenNthCalledWith(5, 3, 4)
    expect(fn).toHaveBeenNthCalledWith(6, 3, 5)

    await expect(r).resolves.toEqual([1, 1, 1, 3, 3, 3])
    expect(fn).toHaveBeenCalledTimes(6)
  })
})
