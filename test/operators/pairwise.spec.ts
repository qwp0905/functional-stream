import { Fs } from '../../src/index.js'

describe('pairwise', () => {
  it('1', async () => {
    const r = Fs.range(3).pairwise().toArray()
    await expect(r).resolves.toStrictEqual([
      [0, 1],
      [1, 2]
    ])
  })
})
