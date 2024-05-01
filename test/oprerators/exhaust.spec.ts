import { Fs } from '../../src/functional-stream.js'
import { IFs } from '../../src/index.js'

describe('exhaust', () => {
  it('1', async () => {
    const r = Fs.of(
      Fs.range(10).concatMap(
        (e) => new Promise<number>((rs) => setTimeout(() => rs(e), 100))
      ),
      Fs.range(10)
    )
      .chain(new Promise<IFs<number>>((rs) => setTimeout(() => rs(Fs.range(3)), 1500)))
      .exhaustAll()
      .toArray()

    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2])
  })
})
