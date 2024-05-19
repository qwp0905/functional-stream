/**
 * @jest-environment jsdom
 */

import { Fs } from '../../src/stream/functional-stream.js'
import { isHtmlElement } from '../../src/utils/functions.js'
declare global {
  interface EventTarget {
    _removeEventListener: EventTarget['removeEventListener']
  }
}

describe('dom', () => {
  let el: HTMLDivElement
  beforeEach(() => {
    el = document.createElement('div')
    el.textContent = 'abc'
  })

  afterEach(() => {
    el.remove()
  })

  it('generator', () => {
    expect(isHtmlElement(el)).toBeTruthy()
  })

  it('fs', async () => {
    let flag = false
    EventTarget.prototype._removeEventListener = EventTarget.prototype.removeEventListener

    EventTarget.prototype.removeEventListener = function (a, b, c) {
      this._removeEventListener(a, b, c)
      flag = true
    }

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
    expect(flag).toBeTruthy()
  })
})
