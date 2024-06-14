import { Fs } from '../../src/index.js'

describe('every', () => {
  it('1', async () => {
    const r = Fs.range(100)
      .every((e) => e.lessThan(121))
      .lastOne()
    await expect(r).resolves.toBe(true)
  })

  it('2', async () => {
    const r = Fs.range(10)
      .every((e) => e.greaterThan(3))
      .lastOne()
    await expect(r).resolves.toBe(false)
  })
})
