import { Readable } from 'stream'
import { isAsyncIterable, isEventSource, isIterable } from '../../src/utils/functions'

describe('functions', () => {
  it('array', () => {
    const arr = []
    expect(isIterable(arr)).toBeTruthy()
    expect(isAsyncIterable(arr)).toBeFalsy()
  })

  it('stream', () => {
    const stream = Readable.from([])
    expect(isAsyncIterable(stream)).toBeTruthy()
    expect(isIterable(stream)).toBeFalsy()
  })

  it('map', () => {
    const map = new Map()
    expect(isIterable(map)).toBeTruthy()
    expect(isAsyncIterable(map)).toBeFalsy()
  })

  it('object', () => {
    const obj = new Object()
    expect(isIterable(obj)).toBeFalsy()
    expect(isAsyncIterable(obj)).toBeFalsy()
  })

  it('set', () => {
    const set = new Set()
    expect(isIterable(set)).toBeTruthy()
    expect(isAsyncIterable(set)).toBeFalsy()
  })

  it('string', () => {
    const str = 'sdlkfjls'
    expect(isAsyncIterable(str)).toBeFalsy()
    expect(isIterable(str)).toBeTruthy()
  })

  it('number', () => {
    const num = 123
    expect(isAsyncIterable(num)).toBeFalsy()
    expect(isIterable(num)).toBeFalsy()
  })

  it('symbol', () => {
    const sym = Symbol('123123123123')
    expect(isAsyncIterable(sym)).toBeFalsy()
    expect(isIterable(sym)).toBeFalsy()
  })

  it('event', async () => {
    const { EventEmitter } = await import('events')
    const event = new EventEmitter()
    expect(isEventSource(event)).toBeTruthy()
  })
})
