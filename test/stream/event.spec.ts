import EventEmitter from "events"
import { InvalidEventSourceError } from "../../src/index.js"
import { fromEvent } from "../../src/stream/generators.js"

describe("fromEvent", () => {
  it("1", () => {
    const next = jest.fn()
    const ev = "click"
    const es = new EventEmitter()
    const mock = jest.spyOn(es, "removeListener")
    const r = fromEvent(es, ev)

    r.watch({ next })

    es.emit(ev, 1)
    es.emit(ev, 2)
    es.emit(ev, 3, 4)

    r.close()
    expect(next).toHaveBeenCalledTimes(3)
    expect(next).toHaveBeenNthCalledWith(1, 1)
    expect(next).toHaveBeenNthCalledWith(2, 2)
    expect(next).toHaveBeenNthCalledWith(3, [3, 4])
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it("2", async () => {
    const r = Promise.resolve().then(() => fromEvent({}, "error"))
    await expect(r).rejects.toThrow(InvalidEventSourceError)
  })
})
