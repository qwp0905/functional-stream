import { Fs } from "../../src/stream/functional-stream.js"
import { SubscriptionTimeoutError } from "../../src/@types/errors.js"

describe("timeout", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it("1", async () => {
    const timeout = 50
    const r = Fs.range(3)
      .concatMap((e) => Fs.of(e).delay(100))
      .timeout(timeout)
      .lastOne()

    jest.advanceTimersByTime(timeout)

    await expect(r).rejects.toThrow(SubscriptionTimeoutError)
  })

  it("2", async () => {
    const timeout = 100
    const fn = jest.fn()
    const r = Fs.range(10)
      .concatMap((e) => Fs.of(e).delay(e.remain(2) ? 150 : 50))
      .timeout(timeout)
      .tap(fn)
      .toArray()

    await jest.advanceTimersByTimeAsync(49)
    expect(fn).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith(0, 0)

    await jest.advanceTimersByTimeAsync(99)
    expect(fn).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(1)

    await expect(r).rejects.toThrow(SubscriptionTimeoutError)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
