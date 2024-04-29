import { Fs } from '../../src'

describe('tap', () => {
  it('1', async () => {
    let c = 0
    await Fs.range(100)
      .tap(() => c++)
      .toPromise()

    expect(c).toBe(100)
  })
})