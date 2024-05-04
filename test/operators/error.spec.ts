import { Fs } from '../../src/stream/functional-stream.js'

describe('error', () => {
  it('err', async () => {
    const err = new Error('123')
    const callback = jest.fn()
    const throwError = jest.fn((e, i) => {
      if (i > 3) {
        throw err
      }
    })

    const r = Fs.range(10).map(throwError).catchError(callback).toPromise()

    await expect(r).rejects.toThrow(err)
    expect(callback).toHaveBeenCalledWith(err)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(throwError).toHaveBeenCalledTimes(5)
  })
})
