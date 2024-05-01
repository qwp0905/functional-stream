import { Fs } from '../../src/functional-stream.js'

describe('copy', () => {
  it('1', async () => {
    const [a, b] = Fs.range(3).copy(2)
    await expect(a.toArray()).resolves.toEqual([0, 1, 2])
    await expect(b.toArray()).resolves.toEqual([0, 1, 2])
  })
})
