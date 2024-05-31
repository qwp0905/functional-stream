import { Fs } from '../../src/index.js'

describe('distinct', () => {
  it('1', async () => {
    const r = Fs.of(1, 2, 3, 4, 1, 2, 4, 5, 6, 7, 6, 7)
      .distinct((e) => e)
      .toArray()
    await expect(r).resolves.toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})
