import { Fs } from '../../src/functional-stream.js'

describe('merge', () => {
  describe('mergeAll', () => {
    it('simple1', async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = Fs.from(arr).mergeAll(1).toArray()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('complex', async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = Fs.from(arr)
        .mergeMap(async (e, i) => {
          await new Promise((r) => setTimeout(r, i * 100))
          return e
        }, 1)
        .mergeAll()
        .toArray()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('empty', async () => {
      const stream = Fs.from([[]]).mergeAll().toArray()
      await expect(stream).resolves.toEqual([])
    })

    it('empty2', async () => {
      const stream = Fs.from([]).mergeAll().toArray()
      await expect(stream).resolves.toEqual([])
    })

    it('complex 2', async () => {
      const r = Fs.range(10)
        .map((e, i) => new Promise((rs) => setTimeout(() => rs(e), 100 * (10 - i))))
        .mergeAll()
        .toArray()
      await expect(r).resolves.toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])
    })

    it('concat 1', async () => {
      const r = Fs.range(10)
        .map((e, i) => new Promise((rs) => setTimeout(() => rs(e), 10 * (10 - i))))
        .concatAll()
        .toArray()
      await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('concat 2', async () => {
      const r = Fs.range(10)
        .concatMap((e, i) => new Promise((rs) => setTimeout(() => rs(e), 10 * (10 - i))))
        .toArray()
      await expect(r).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })
})
