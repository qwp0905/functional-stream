export function isFunction(v: any): v is (...args: any[]) => any {
  return typeof v === 'function'
}

export function isAsyncIterable<T = any>(v: any): v is AsyncIterable<T> {
  return isFunction(v?.[Symbol.asyncIterator])
}

export function isIterable<T = any>(v: any): v is Iterable<T> {
  return isFunction(v?.[Symbol.iterator])
}

export function isReadableStream<T = any>(v: any): v is ReadableStream<T> {
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
