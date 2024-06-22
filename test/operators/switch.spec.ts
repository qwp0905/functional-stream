import { Fs } from "../../src/stream/functional-stream.js"
import { IFs } from "../../src/index.js"
import { sleep } from "../../src/utils/sleep.js"

describe("switch", () => {
  it("1", async () => {
    const r = Fs.new<IFs<number>>((sub) => {
      Promise.resolve()
        .then(async () => {
          sub.publish(Fs.range(10).concatMap((e) => sleep(100).then(() => e)))

          await sleep(550)
          sub.publish(Fs.range(5).map((e) => e + 10))
        })
        .finally(() => sub.commit())
    })
      .switchAll()
      .toArray()

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 10, 11, 12, 13, 14])
  })
})
