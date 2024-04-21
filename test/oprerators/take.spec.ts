import { FStream } from '../../src'

describe('take', () => {
  it('take 1', async () => {
    const stream = FStream.range(10).take(1).array()
    await expect(stream).resolves.toEqual([0])
  })

  it('take 2', async () => {
    const stream = FStream.range(10)
    await expect(stream.take(5).array()).resolves.toStrictEqual([0, 1, 2, 3, 4])
  })

  it('take 3', async () => {
    const stream = FStream.range(10)
    await expect(stream.take(8).array()).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('take 4', async () => {
    const data = new Array(98).fill(null).map((_, i) => i)
    await expect(FStream.range(100).take(98).array()).resolves.toStrictEqual(data)
  })

  it('take 5', async () => {
    let count = 0
    await FStream.range(10)
      .take(5)
      .tap(() => count++)
      .promise()
    expect(count).toBe(5)
  })
})
