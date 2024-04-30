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
  })
})
