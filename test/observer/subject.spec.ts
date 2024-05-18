import { Subject } from '../../src/index.js'

describe('subject', () => {
  it('1', () => {
    const next = jest.fn()
    const error = jest.fn()
    const complete = jest.fn()
    const sub = new Subject()
    sub.watch({ next, error, complete })
    sub.publish(1)
    sub.publish(2)
    sub.publish(3)
    sub.publish(4)
    sub.commit()
    expect(next).toHaveBeenNthCalledWith(1, 1)
    expect(next).toHaveBeenNthCalledWith(2, 2)
    expect(next).toHaveBeenNthCalledWith(3, 3)
    expect(next).toHaveBeenNthCalledWith(4, 4)
    expect(next).toHaveBeenCalledTimes(4)
    expect(error).toHaveBeenCalledTimes(0)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('2', () => {
    const next = jest.fn()
    const error = jest.fn()
    const complete = jest.fn()
    const sub = new Subject()
    const err = new Error('123')
    sub.watch({ next, error, complete })
    sub.abort(err)
    expect(next).toHaveBeenCalledTimes(0)
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenNthCalledWith(1, err)
    expect(complete).toHaveBeenCalledTimes(0)
  })

  it('3', () => {
    const next = jest.fn()
    const error = jest.fn()
    const complete = jest.fn()
    const sub = new Subject()
    sub.watch({ next, error, complete })

    sub.publish(1)
    sub.publish(2)
    sub.publish(3)
    sub.publish(4)
    sub.commit()

    expect(next).toHaveBeenNthCalledWith(1, 1)
    expect(next).toHaveBeenNthCalledWith(2, 2)
    expect(next).toHaveBeenNthCalledWith(3, 3)
    expect(next).toHaveBeenNthCalledWith(4, 4)
    expect(next).toHaveBeenCalledTimes(4)
    expect(error).toHaveBeenCalledTimes(0)
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('add', async () => {
    const f = jest.fn()
    const sub = new Subject()
    sub.watch({ next() {} })
    sub.add(f)
    sub.commit()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('iter', async () => {
    const sub = new Subject<number>()
    Promise.resolve().then(() => {
      for (let i = 0; i < 10; i++) {
        sub.publish(i)
      }
      sub.commit()
    })

    const arr: number[] = []
    for await (const e of sub) {
      arr.push(e)
    }
    expect(arr).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})
