import { IStreamObject } from '../src/@types/stream'
import { StreamObject } from '../src'

describe('number', () => {
  const arr = new Array(10).fill(null).map((_, i) => i)
  let stream: IStreamObject<number>

  beforeEach(() => {
    stream = StreamObject.from(arr)
  })

  it('to promise', async () => {
    await expect(stream.promise()).resolves.toEqual(9)
  })

  it('to array', async () => {
    await expect(stream.array()).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('buffer count', async () => {
    await expect(stream.bufferCount(2).array()).resolves.toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
      [6, 7],
      [8, 9]
    ])
  })

  it('buffer count 2', async () => {
    await expect(stream.bufferCount(3).array()).resolves.toStrictEqual([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9]
    ])
  })

  it('skip', async () => {
    await expect(stream.skip(8).array()).resolves.toStrictEqual([8, 9])
  })

  it('take 1', async () => {
    await expect(stream.take(1).array()).resolves.toStrictEqual([0])
  })

  it('take 2', async () => {
    await expect(stream.take(5).array()).resolves.toStrictEqual([0, 1, 2, 3, 4])
  })

  it('take 3', async () => {
    await expect(stream.take(8).array()).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  it('take 4', async () => {
    const data = new Array(98).fill(null).map((_, i) => i)
    await expect(StreamObject.range(100).take(98).array()).resolves.toStrictEqual(data)
  })
})
