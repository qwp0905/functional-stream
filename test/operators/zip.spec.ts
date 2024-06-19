import { Fs } from '../../src/index.js'

describe('zip', () => {
  it('1', async () => {
    const r = Fs.range(3).zipWith(Fs.range(5, 3)).toArray()
    await expect(r).resolves.toStrictEqual([
      [0, 3],
      [1, 4],
      [2, 5],
      [undefined, 6],
      [undefined, 7]
    ])
  })
})
