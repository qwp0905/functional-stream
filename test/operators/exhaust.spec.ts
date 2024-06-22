import { Fs } from "../../src/stream/functional-stream.js"
import { sleep } from "../../src/utils/sleep.js"

describe("exhaust", () => {
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
      .toArray()

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2])
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
        s.publish(
          Fs.range(3)
            .take(3)
            .map(() => 3)
        )
        s.commit()
      }, 350)
    })
      .exhaustAll()
      .toArray()
    await expect(r).resolves.toEqual([1, 1, 1, 3, 3, 3])
  })
})
