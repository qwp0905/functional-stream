import { Fs } from '../../src/stream/functional-stream.js'

describe('skip', () => {
  it('skip', async () => {
    const stream = Fs.range(10)
    await expect(stream.skip(8).toArray()).resolves.toStrictEqual([8, 9])
  })
})

describe('skipWhile', () => {
  it('1', async () => {
    const r = Fs.range(10)
      .skipWhile((e) => e < 4)
      .toArray()
    await expect(r).resolves.toStrictEqual([4, 5, 6, 7, 8, 9])
  })
})

describe('skipLast', () => {
  it('1', async () => {
    const r = Fs.range(10).skipLast(3).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
