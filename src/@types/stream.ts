import { Readable, Transform, Writable } from 'stream'
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

export interface IFStream<T> extends AsyncIterable<T> {
  watch(options: IStreamReadOptions<T>): void
  promise(): Promise<T>
  array(): Promise<T[]>
  some(callback: TFilterCallback<T>): Promise<boolean>
  every(callback: TFilterCallback<T>): Promise<boolean>

  map<R>(callback: TMapCallback<T, R>): IFStream<R>
  filter(callback: TFilterCallback<T>): IFStream<T>
  tap(callback: TTapCallback<T>): IFStream<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IFStream<A>
  take(count: number): IFStream<T>
  skip(count: number): IFStream<T>
  bufferCount(count: number): IFStream<T[]>
  mergeAll(concurrency?: number): IFStream<T extends StreamLike<infer K> ? K : never>
  concatAll(): IFStream<T extends StreamLike<infer K> ? K : never>
  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency?: number
  ): IFStream<R extends StreamLike<infer K> ? K : never>
  concatMap<R = T>(
    callback: TMapCallback<T, R>
  ): IFStream<R extends StreamLike<infer K> ? K : never>
  finalize(callback: TAnyCallback): IFStream<T>
  delay(ms: number): IFStream<T>
  chain(stream: StreamLike<T>): IFStream<T>
  catchError(callback: TErrorCallback): IFStream<T>
  copy(count: number): IFStream<T>[]
  ifEmpty(callback: TAnyCallback): IFStream<T>
}

export type Iter<T> = AsyncIterable<T> | Iterable<T>

export type StreamLike<T> =
  | Readable
  | Writable
  | Transform
  | Iter<T>
  | IFStream<T>
  | Pipeline<T>
  | Promise<T>
