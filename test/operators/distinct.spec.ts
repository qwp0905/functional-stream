import { Fs } from '../../src/index.js'

describe('distinct', () => {
  it('1', async () => {
    const r = Fs.of(1, 2, 3, 4, 1, 2, 4, 5, 6, 7, 6, 7).distinct().toArray()
    await expect(r).resolves.toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('2', async () => {
    const r = Fs.range(10)
      .map((e) => ({ num: e % 3 }))
      .distinct((e) => e.num)
      .map((e) => e.num)
      .toArray()
    await expect(r).resolves.toEqual([0, 1, 2])
  })
})
