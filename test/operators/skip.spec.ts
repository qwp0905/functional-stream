import { Fs } from '../../src/stream/functional-stream.js'

describe('skip', () => {
  it('skip', async () => {
    const stream = Fs.range(10)
    await expect(stream.skip(8).toArray()).resolves.toStrictEqual([8, 9])
  })
})
