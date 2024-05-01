import { Fs } from '../../src/functional-stream.js'

describe('empty', () => {
  it('throw', async () => {
    const err = new Error('123123')
    const r = Fs.range(10)
      .filter((e) => e > 100)
      .throwIfEmpty(err)
      .toPromise()
    await expect(r).rejects.toThrow(err)
  })

  it('throw 2', async () => {
    const err = new Error('123123')
    const r = Fs.range(10).throwIfEmpty(err).toPromise()
    await expect(r).resolves.toEqual(9)
  })

  it('default 1', async () => {
    const r = Fs.range(10)
      .filter((e) => e > 100)
      .defaultIfEmpty(100)
      .toPromise()
    await expect(r).resolves.toBe(100)
  })

  it('default 2', async () => {
    const r = Fs.range(10).defaultIfEmpty(100).toPromise()
    await expect(r).resolves.toEqual(9)
  })
})
