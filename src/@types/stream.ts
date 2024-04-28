import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './callback'
import { Pipeline } from '../observer/pipeline'

export interface IStreamReadOptions<T> {
  next(data: T): any
  error?(err: Error): any
  complete?(): any
}

export interface IFs<T> extends AsyncIterable<T> {
  watch(options: IStreamReadOptions<T>): void
  unwatch(): void
  toPromise(): Promise<T>
  toArray(): Promise<T[]>

  count(): IFs<number>
  some(callback: TFilterCallback<T>): IFs<boolean>
  every(callback: TFilterCallback<T>): IFs<boolean>
  map<R>(callback: TMapCallback<T, R>): IFs<R>
  filter(callback: TFilterCallback<T>): IFs<T>
  tap(callback: TTapCallback<T>): IFs<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A>
  take(count: number): IFs<T>
  skip(count: number): IFs<T>
  bufferCount(count: number): IFs<T[]>
  mergeAll(concurrency?: number): IFs<T extends StreamLike<infer K> ? K : never>
  concatAll(): IFs<T extends StreamLike<infer K> ? K : never>
  mergeMap<R>(callback: TMapCallback<T, StreamLike<R>>, concurrency?: number): IFs<R>
  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R>
  finalize(callback: TAnyCallback): IFs<T>
  delay(ms: number): IFs<T>
  chain(stream: StreamLike<T>): IFs<T>
  catchError(callback: TErrorCallback): IFs<T>
  copy(count: number): IFs<T>[]
  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>>
  defaultIfEmpty(v: T): IFs<T>
  throwIfEmpty(err: any): IFs<T>
}

export type StreamLike<T> =
  | ReadableStream<T>
  | AsyncIterable<T>
  | Iterable<T>
  | IFs<T>
  | Pipeline<T>
  | Promise<T>
