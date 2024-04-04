export function isAsyncIterable(v: any): boolean {
  return typeof v?.[Symbol.asyncIterator] === 'function' ?? false
}

export function isIterable(v: any): boolean {
  return typeof v?.[Symbol.iterator] === 'function' ?? false
}
