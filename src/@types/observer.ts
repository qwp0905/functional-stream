export interface IObserver<T, R = any> {
  next(this: R, event: T): any
  error?(this: R, err: Error): any
  complete?(this: R): any
}

export interface ISubject<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>
  watch(observer: IObserver<T>): void
  publish(event: T): void
  abort(err: Error): void
  commit(): void
  add<R>(next: ISubject<R> | (() => void)): void
}

export interface IPipeline<T, R = T> extends ISubject<R>, IObserver<T> {}
