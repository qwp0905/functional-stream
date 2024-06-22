import { Fs } from '../../src/stream/functional-stream.js'

describe('error', () => {
  it('err', async () => {
    const err = new Error('123')
    const callback = jest.fn()
    const throwError = jest.fn((e, i) => {
      if (i > 3) {
        throw err
      }
      return e
    })

    const r = Fs.range(10).map(throwError).catchError(callback).toArray()

    await expect(r).resolves.toStrictEqual([0, 1, 2, 3])
    expect(callback).toHaveBeenCalledWith(err)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(throwError).toHaveBeenCalledTimes(5)
  })
})

describe('throwError', () => {
  it('1', async () => {
    const err = new Error('123')
    const r = Fs.throw(err).lastOne()
    await expect(r).rejects.toThrow(err)
  })
})
