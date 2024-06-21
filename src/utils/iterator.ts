export function toAsyncIter<T>(v: AsyncIterable<T>): AsyncIterator<T> {
  return v[Symbol.asyncIterator]()
}
