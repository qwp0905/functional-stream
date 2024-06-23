import { Fs } from "../../src/stream/functional-stream.js"
import { SubscriptionTimeoutError } from "../../src/utils/errors.js"

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
})
