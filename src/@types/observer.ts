export interface IObserver<T, R = any> {
  next(this: R, event: T): any
  error?(this: R, err: unknown): any
  complete?(this: R): any
}

export interface ISubject<T> extends AsyncIterable<T> {
  watch(observer: IObserver<T>): void
  publish(event: T): void
  abort(err: unknown): void
  commit(): void
  add<R>(next: ISubject<R> | (() => void)): void
  close(): void
}
