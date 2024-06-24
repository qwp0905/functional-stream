import { Fs } from "../../src/index.js"

describe("watch", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it("1", () => {
    const i = 100
    const next = jest.fn()
    const error = jest.fn()
    const complete = jest.fn()
    const fs = Fs.interval(i).take(5)
    fs.watch({ next, error, complete })

    jest.advanceTimersByTime(i - 1)
    expect(next).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(next).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    jest.advanceTimersByTime(i - 1)
    expect(next).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(next).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    jest.advanceTimersByTime(i - 1)
    expect(next).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    jest.advanceTimersByTime(i - 1)
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(next).toHaveBeenCalledTimes(4)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    jest.advanceTimersByTime(i - 1)
    expect(next).toHaveBeenCalledTimes(4)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(next).toHaveBeenCalledTimes(5)
    expect(error).not.toHaveBeenCalled()
    expect(complete).toHaveBeenCalledTimes(1)

    fs.close()
  })

  it("2", async () => {
    const i = 100
    const err = new Error("error")
    const next = jest.fn()
    const error = jest.fn()
    const complete = jest.fn()
    const fs = Fs.interval(i)
      .take(5)
      .mergeMap((e, i) => (i.equal(3) ? Fs.throw(err) : Fs.of(e)))
    fs.watch({ next, error, complete })

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(next).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(next).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(next).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(next).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(next).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(i - 1)
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).not.toHaveBeenCalled()
    expect(complete).not.toHaveBeenCalled()
    await jest.advanceTimersByTimeAsync(1)
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenLastCalledWith(err)

    await jest.runAllTimersAsync()
    expect(next).toHaveBeenCalledTimes(3)
    expect(error).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()

    fs.close()
  })
})
