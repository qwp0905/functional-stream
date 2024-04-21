import { FStream } from '../src'

describe('number', () => {
  const arr = new Array(10).fill(null).map((_, i) => i)

  it('to promise', async () => {
    await expect(FStream.from(arr).promise()).resolves.toEqual(9)
  })

  it('to array', async () => {
    const r = FStream.from(arr).array()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
