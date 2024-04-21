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
  promise(): Promise<T>
  array(): Promise<T[]>
  some(callback: TFilterCallback<T>): Promise<boolean>
  every(callback: TFilterCallback<T>): Promise<boolean>

  map<R>(callback: TMapCallback<T, R>): IFs<R>
  filter(callback: TFilterCallback<T>): IFs<T>
  tap(callback: TTapCallback<T>): IFs<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFs<A>
  take(count: number): IFs<T>
  skip(count: number): IFs<T>
  bufferCount(count: number): IFs<T[]>
  mergeAll(concurrency?: number): IFs<T extends StreamLike<infer K> ? K : never>
  concatAll(): IFs<T extends StreamLike<infer K> ? K : never>
  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency?: number
  ): IFs<R extends StreamLike<infer K> ? K : never>
  concatMap<R = T>(
    callback: TMapCallback<T, R>
  ): IFs<R extends StreamLike<infer K> ? K : never>
  finalize(callback: TAnyCallback): IFs<T>
  delay(ms: number): IFs<T>
  chain(stream: StreamLike<T>): IFs<T>
  catchError(callback: TErrorCallback): IFs<T>
  copy(count: number): IFs<T>[]
  ifEmpty(callback: TAnyCallback): IFs<T>
}

export type StreamLike<T> =
  | ReadableStream<T>
  | AsyncIterable<T>
  | Iterable<T>
  | IFs<T>
  | Pipeline<T>
  | Promise<T>
