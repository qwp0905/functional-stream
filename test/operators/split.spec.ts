import { Fs } from '../../src/index.js'

describe('split', () => {
  it('1', async () => {
    const a = ['123', '123', '1\n1231\n23', '12311\n12']
    const r = Fs.from(a).split('\n').toArray()
    await expect(r).resolves.toStrictEqual(['1231231', '1231', '2312311', '12'])
  })
})
