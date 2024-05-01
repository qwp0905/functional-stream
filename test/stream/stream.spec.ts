import { Fs } from '../../src/stream/functional-stream.js'
import { sleep, sleepWith } from '../../src/utils/sleep.js'

describe('number', () => {
  const arr = new Array(10).fill(null).map((_, i) => i)

  it('to promise', async () => {
    await expect(Fs.from(arr).toPromise()).resolves.toEqual(9)
  })

  it('to array', async () => {
    const r = Fs.from(arr).toArray()
    await expect(r).resolves.toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
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

  it('race', async () => {
    const r = Fs.race(
      sleep(10).then(() => Fs.range(1)),
      sleep(30).then(() => Fs.range(3)),
      sleep(50).then(() => Fs.range(5))
    )
      .mergeAll()
      .toArray()

    await expect(r).resolves.toEqual([0])
  })
})

describe('generate', () => {
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
})