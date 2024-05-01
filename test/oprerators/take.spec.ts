import { Fs } from '../../src/stream/functional-stream.js'

describe('take', () => {
  it('take 1', async () => {
    const stream = Fs.range(10).take(1).toArray()
    await expect(stream).resolves.toEqual([0])
  })

  it('take 2', async () => {
    const stream = Fs.range(10)
    await expect(stream.take(5).toArray()).resolves.toStrictEqual([0, 1, 2, 3, 4])
  })

  it('take 3', async () => {
    const stream = Fs.range(10)
    await expect(stream.take(8).toArray()).resolves.toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7
    ])
  })

  it('take 4', async () => {
    const data = new Array(98).fill(null).map((_, i) => i)
    await expect(Fs.range(100).take(98).toArray()).resolves.toStrictEqual(data)
  })

  it('take 5', async () => {
    let count = 0
    await Fs.range(10)
      .take(5)
      .tap(() => count++)
      .toPromise()
    expect(count).toBe(5)
  })
})
