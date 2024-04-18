import { StreamObject } from '../../src'

describe('buffer count', () => {
  it('number1', async () => {
    const stream = StreamObject.range(10).bufferCount(10).array()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]])
  })

  it('number2', async () => {
    const stream = StreamObject.range(10).bufferCount(3).array()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })

  it('buffer count', async () => {
    const result = StreamObject.range(10).bufferCount(2).array()
    await expect(result).resolves.toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9]
    ])
  })

  it('buffer count 2', async () => {
    const result = StreamObject.range(10).bufferCount(3).array()
    await expect(result).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })
})
