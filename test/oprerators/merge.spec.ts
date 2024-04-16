import { StreamObject } from '../../src'

describe('merge', () => {
  describe('mergeAll', () => {
    it('simple1', async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = StreamObject.from(arr).mergeAll().array()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('complex', async () => {
      const arr = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
      const stream = StreamObject.from(arr)
        .mergeMap(async (e, i) => {
          await new Promise((r) => setTimeout(r, i * 500))
          return e
        }, 1)
        .mergeAll()
        .array()
      await expect(stream).resolves.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('empty', async () => {
      const stream = StreamObject.from([[]]).mergeAll().array()
      await expect(stream).resolves.toEqual([])
    })

    it('empty2', async () => {
      const stream = StreamObject.from([]).mergeAll().array()
      await expect(stream).resolves.toEqual([])
    })
  })
})
