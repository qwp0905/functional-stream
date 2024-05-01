import { Fs } from '../../src/functional-stream.js'

describe('finalize', () => {
  it('1', async () => {
    let i = false
    const cb = jest.fn(() => {
      i = false
    })

    await Fs.range(10)
      .tap(() => (i = true))
      .finalize(cb)
      .toPromise()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(i).toBe(false)
  })
})
