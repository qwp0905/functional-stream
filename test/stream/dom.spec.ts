/**
 * @jest-environment jsdom
 */

import { Fs } from '../../src/functional-stream.js'
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
    const r = Fs.fromEvent(el, 'click').map((e) => e.target)
    r.watch({
      next(e) {
        a.push(e)
      }
    })

    el.click()
    el.click()
    el.click()
    r.unwatch()

    expect(a).toEqual([el, el, el])
    expect(flag).toBeTruthy()
  })
})
