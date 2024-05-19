/**
 * @jest-environment jsdom
 */

import { Fs } from '../../src/stream/functional-stream.js'
import { isHtmlElement } from '../../src/utils/functions.js'

describe('dom', () => {
  let el: HTMLDivElement
  let spy: jest.SpyInstance
  beforeEach(() => {
    spy = jest.spyOn(EventTarget.prototype, 'removeEventListener')
    el = document.createElement('div')
    el.textContent = 'abc'
  })

  afterEach(() => {
    el.remove()
    spy.mockReset()
  })

  it('generator', () => {
    expect(isHtmlElement(el)).toBeTruthy()
  })

  it('fs', async () => {
    const a: any[] = []
    const b: any[] = []
    const r = Fs.fromEvent(el, 'click')
    r.watch({
      next(e) {
        a.push(e.target)
      }
    })
    r.watch({
      next(e) {
        b.push(e.target?.textContent)
      }
    })

    el.click()
    el.click()
    el.click()
    r.close()

    expect(a).toEqual([el, el, el])
    expect(b).toEqual(['abc', 'abc', 'abc'])
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
