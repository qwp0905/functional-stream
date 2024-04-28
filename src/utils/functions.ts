export function isFunction(v: any): boolean {
  return typeof v === 'function'
}

export function isAsyncIterable(v: any): boolean {
  return isFunction(v?.[Symbol.asyncIterator])
}

export function isIterable(v: any): boolean {
  return isFunction(v?.[Symbol.iterator])
}

export function isReadableStream(v: any): boolean {
  return isFunction(v?.getReader)
}

export function isEventSource(v: any): boolean {
  return isFunction(v?.addListener) && isFunction(v?.removeListener)
}

export function isHtmlElement(v: any): boolean {
  return isFunction(v?.addEventListener) && isFunction(v?.removeEventListener)
}

export function isOnOffEventSource(v: any): boolean {
  return isFunction(v?.on) && isFunction(v?.off)
}
