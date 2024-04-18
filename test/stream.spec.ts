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
})
