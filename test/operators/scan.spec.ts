import { Fs } from '../../src/index.js'

describe('scan', () => {
  it('1', async () => {
    const r = Fs.range(3)
      .scan<number[]>((acc, cur) => acc.concat([cur]), [])
      .toArray()

    await expect(r).resolves.toStrictEqual([[0], [0, 1], [0, 1, 2]])
  })
})
