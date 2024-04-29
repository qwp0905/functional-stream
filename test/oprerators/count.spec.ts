import { Fs } from '../../src'

describe('count', () => {
  it('1', async () => {
    const r = Fs.range(10).count().toPromise()
    await expect(r).resolves.toBe(10)
  })
})
