import { Fs } from '../../src/functional-stream.js'

describe('chain', () => {
  it('1', async () => {
    const result = Fs.range(5).chain([5, 6]).toArray()
    await expect(result).resolves.toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('2', async () => {
    const r1 = Fs.range(5).mergeMap(
      (e) => new Promise<number>((resolve) => setTimeout(() => resolve(e), 100))
    )
    const r2 = Fs.range(3)
      .map((e) => -e)
      .chain(r1)
      .toArray()

    await expect(r2).resolves.toEqual([-0, -1, -2, 0, 1, 2, 3, 4])
  })
})
