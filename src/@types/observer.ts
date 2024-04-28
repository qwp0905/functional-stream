export interface IObserver<T, R = any> {
  next(this: R, event: T): any
  error?(this: R, err: Error): any
  complete?(this: R): any
}
