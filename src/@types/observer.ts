import { IFunction0 } from "./callback.js"

export interface Closable<T> extends AsyncIterable<T> {
  close(): void
}

export interface IObserver<T> {
  next(event: T): any
  error?(err: unknown): any
  complete?(): any
}

export interface ISubject<T> extends Closable<T> {
  watch(observer: IObserver<T>): void
  publish(event: T): void
  abort(err: unknown): void
  commit(): void
  add<R>(next: ISubject<R> | IFunction0<void>): void
}
