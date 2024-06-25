import { IFunction0 } from "./callback.js"

export interface Closable<T> extends AsyncIterable<T> {
  close(): void
}

export interface IObserver<T, R = any> {
  next(this: R, event: T): any
  error?(this: R, err: unknown): any
  complete?(this: R): any
}

export interface ISubject<T> extends Closable<T> {
  watch(observer: IObserver<T>): void
  publish(event: T): void
  abort(err: unknown): void
  commit(): void
  add<R>(next: ISubject<R> | IFunction0<void>): void
}
