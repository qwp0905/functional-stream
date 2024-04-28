/**
 * @jest-environment jsdom
 */

import { Fs } from '../../src'
import { isHtmlElement } from '../../src/utils/functions'

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
    el.textContent = '123123'
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
