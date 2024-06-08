import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './callback.js'
import { ISubject } from './observer.js'

export interface IStreamReadOptions<T> {
  next(data: T): any
  error?(err: Error): any
  complete?(): any
}

export interface IFs<T> extends AsyncIterable<T> {
  watch(options: IStreamReadOptions<T>): void
  close(): void
  toPromise(): Promise<T>
  toArray(): Promise<T[]>
  forEach(callback: TMapCallback<T, any>): Promise<void>

  count(): IFs<number>
  some(callback: TFilterCallback<T>): IFs<boolean>
  every(callback: TFilterCallback<T>): IFs<boolean>
  map<R>(callback: TMapCallback<T, R>): IFs<R>
  filter(callback: TFilterCallback<T>): IFs<T>
  tap(callback: TTapCallback<T>): IFs<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A>
  scan<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A>
  take(count: number): IFs<T>
  skip(count: number): IFs<T>
  bufferCount(count: number): IFs<T[]>
  bufferTime(interval: number): IFs<T[]>
  mergeAll(concurrency?: number): IFs<T extends StreamLike<infer K> ? K : never>
  concatAll(): IFs<T extends StreamLike<infer K> ? K : never>
  exhaustAll(): IFs<T extends StreamLike<infer K> ? K : never>
  switchAll(): IFs<T extends StreamLike<infer K> ? K : never>
  mergeMap<R>(callback: TMapCallback<T, StreamLike<R>>, concurrency?: number): IFs<R>
  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R>
  exhaustMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R>
  switchMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R>
  finalize(callback: TAnyCallback): IFs<T>
  delay(ms: number): IFs<T>
  chain(stream: StreamLike<T>): IFs<T>
  catchError(callback: TErrorCallback): IFs<T>
  copy(count: number): IFs<T>[]
  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>>
  defaultIfEmpty(v: T): IFs<T>
  throwIfEmpty(err?: unknown): IFs<T>
  timeout(each: number): IFs<T>
  startWith(v: T): IFs<T>
  endWith(v: T): IFs<T>
  pairwise(): IFs<[T, T]>
  repeat(count: number): IFs<T>
  split(delimiter: string): IFs<T extends string ? string : never>
  distinct<K>(callback?: TMapCallback<T, K>): IFs<T>
  takeWhile(callback: TMapCallback<T, boolean>): IFs<T>
  skipWhile(callback: TMapCallback<T, boolean>): IFs<T>
}

export type StreamLike<T> =
  | ReadableStream<T>
  | AsyncIterable<T>
  | Iterable<T>
  | IFs<T>
  | ISubject<T>
  | Promise<T>
