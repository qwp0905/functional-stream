import { Fs } from '../../src/stream/functional-stream.js'
import { sleep, sleepWith } from '../../src/utils/sleep.js'

describe('number', () => {
  const arr = new Array(10).fill(null).map((_, i) => i)

  it('to promise', async () => {
    await expect(Fs.from(arr).lastOne()).resolves.toEqual(9)
  })

  it('to array', async () => {
    const r = Fs.from(arr).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('forEach', async () => {
    const mock = jest.fn()
    await Fs.range(5).forEach(mock)
    expect(mock).toHaveBeenNthCalledWith(1, 0, 0)
    expect(mock).toHaveBeenNthCalledWith(2, 1, 1)
    expect(mock).toHaveBeenNthCalledWith(3, 2, 2)
    expect(mock).toHaveBeenNthCalledWith(4, 3, 3)
    expect(mock).toHaveBeenNthCalledWith(5, 4, 4)
  })

  it('complex', async () => {
    const r = Fs.range(10)
      .bufferCount(2)
      .map((e) => Promise.resolve(e))
      .delay(100)
      .concatAll()
      .skip(1)
      .map((e) => e.reduce((a, c) => a + c, 0))
      .map((e) => Promise.resolve(e))
      .delay(100)
      .mergeAll(1)
      .toArray()
    await expect(r).resolves.toEqual([5, 9, 13, 17])
  })

  it('complex 2', async () => {
    const r = Fs.range(10)
      .bufferCount(2)
      .mergeMap((e) => sleepWith(e, 100), 3)
      .skip(1)
      .mergeAll(1)
      .chain([1, 2, 3])
      .mergeMap((e) => sleepWith(e, 10))
      .bufferCount(3)
      .toArray()
    await expect(r).resolves.toEqual([
      [2, 3, 4],
      [5, 6, 7],
      [8, 9, 1],
      [2, 3]
    ])
  })
})

describe('generate', () => {
  describe('race', () => {
    it('1', async () => {
      const r = Fs.race(
        Fs.range(1).delay(10),
        Fs.range(3).delay(30),
        Fs.range(5).delay(50)
      ).toArray()

      await expect(r).resolves.toEqual([0])
    })

    it('2', async () => {
      let cb = jest.fn()
      const r = Fs.race(Fs.interval(10), Fs.interval(20).tap(cb)).take(3).toArray()

      await expect(r).resolves.toStrictEqual([0, 1, 2])
      expect(cb).not.toHaveBeenCalled()
    })
  })

  it('readable', async () => {
    const rs = new ReadableStream({
      start(con) {
        for (let i = 0; i < 10; i++) {
          con.enqueue(i)
        }
        con.close()
      }
    })
    const r = Fs.from(rs).toArray()
    await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('promise', async () => {
    const r = Fs.from(Promise.resolve(10)).lastOne()
    await expect(r).resolves.toEqual(10)
  })

  it('zip', async () => {
    const r = Fs.zip(Fs.range(3), Fs.range(5, 3)).toArray()
    await expect(r).resolves.toStrictEqual([
      [0, 3],
      [1, 4],
      [2, 5],
      [undefined, 6],
      [undefined, 7]
    ])
  })
})

describe('interval', () => {
  it('1', async () => {
    const r = Fs.interval(10).take(3).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2])
  })

  it('2', async () => {
    const r = Fs.interval(10).startWith(100).take(1).toArray()
    await expect(r).resolves.toStrictEqual([100])
  })
})
