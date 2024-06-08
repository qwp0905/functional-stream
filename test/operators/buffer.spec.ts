import { Fs } from '../../src/stream/functional-stream.js'

describe('buffer count', () => {
  it('number1', async () => {
    const stream = Fs.range(10).bufferCount(10).toArray()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]])
  })

  it('number2', async () => {
    const stream = Fs.range(10).bufferCount(3).toArray()
    await expect(stream).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })

  it('buffer count', async () => {
    const result = Fs.range(10).bufferCount(2).toArray()
    await expect(result).resolves.toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9]
    ])
  })

  it('buffer count 2', async () => {
    const result = Fs.range(10).bufferCount(3).toArray()
    await expect(result).resolves.toStrictEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })
})

describe('buffer time', () => {
  it('1', async () => {
    const r = Fs.range(10)
      .concatMap((e) => Fs.of(e).delay(100))
      .bufferTime(320)
      .toArray()
    await expect(r).resolves.toEqual([[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]])
  })
})
