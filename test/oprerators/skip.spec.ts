import { FStream } from '../../src'

describe('skip', () => {
  it('skip', async () => {
    const stream = FStream.range(10)
    await expect(stream.skip(8).array()).resolves.toStrictEqual([8, 9])
  })
})
