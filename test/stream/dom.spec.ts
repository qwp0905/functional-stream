/**
 * @jest-environment jsdom
 */

import { Fs } from '../../src'
import { isHtmlElement } from '../../src/utils/functions'
declare global {
  interface EventTarget {
    _addEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean
    ): void
    _removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject | null,
      options?: EventListenerOptions | boolean
    ): void
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
    EventTarget.prototype._addEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype._removeEventListener = EventTarget.prototype.removeEventListener

    EventTarget.prototype.addEventListener = function (a, b, c) {
      if (c == undefined) c = false
      this._addEventListener(a, b, c)
      if (!this.eventListenerList) this.eventListenerList = {}
      if (!this.eventListenerList[a]) this.eventListenerList[a] = []
      this.eventListenerList[a].push({ listener: b, options: c })
    }
    EventTarget.prototype.removeEventListener = function (a, b, c) {
      this._removeEventListener(a, b, c)
      console.log('called')
    }

    const a: any[] = []
    const r = Fs.fromEvent<MouseEvent>(el, 'click')
    r.watch({
      next(e) {
        a.push(e.target)
      }
    })

    el.click()
    el.click()
    r.unwatch()
    expect(a).toEqual([el, el])
  })
})
