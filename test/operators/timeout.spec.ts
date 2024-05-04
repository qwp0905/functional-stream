import { Fs } from '../../src/stream/functional-stream.js'
import { SubscriptionTimeoutError } from '../../src/utils/errors.js'
import { sleep } from '../../src/utils/sleep.js'

describe('timeout', () => {
  it('1', async () => {
    const r = Fs.range(3)
      .concatMap((e) => sleep(100).then(() => e))
      .timeout(50)
      .toPromise()

    await expect(r).rejects.toThrow(SubscriptionTimeoutError)
  })
})
