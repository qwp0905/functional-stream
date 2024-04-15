import { Readable, Transform, Writable } from 'stream'
import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './callback'

export interface IStreamReadOptions<T> {
  next(data: T): any
  error?(err: Error): any
  complete?(): any
}

export interface IStreamObject<T> extends AsyncIterable<T> {
  watch(options: IStreamReadOptions<T>): any
  promise(): Promise<T>
  array(): Promise<T[]>
  some(callback: TFilterCallback<T>): Promise<boolean>
  every(callback: TFilterCallback<T>): Promise<boolean>
  map<R>(callback: TMapCallback<T, R>): IStreamObject<R>
  filter(callback: TFilterCallback<T>): IStreamObject<T>
  tap(callback: TTapCallback<T>): IStreamObject<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, initialValue?: A): IStreamObject<A>
  take(count: number): IStreamObject<T>
  skip(count: number): IStreamObject<T>
  bufferCount(count: number): IStreamObject<T[]>
  mergeAll(): IStreamObject<T extends StreamLike<infer K> ? K : never>
  concatAll(): IStreamObject<T extends StreamLike<infer K> ? K : never>
  mergeMap<R = T>(
    callback: TMapCallback<T, R>,
    concurrency?: number
  ): IStreamObject<R extends StreamLike<infer K> ? K : never>
  concatMap<R = T>(
    callback: TMapCallback<T, R>
  ): IStreamObject<R extends StreamLike<infer K> ? K : never>
  finalize(callback: TAnyCallback): IStreamObject<T>
  delay(ms: number): IStreamObject<T>
  chain(stream: StreamLike<T>): IStreamObject<T>
  catchError(callback: TErrorCallback): IStreamObject<T>
  copy(count: number): IStreamObject<T>[]
  ifEmpty(callback: TAnyCallback): IStreamObject<T>
}

export type Iter<T> = AsyncIterable<T> | Iterable<T>

export type StreamLike<T> =
  | Readable
  | Writable
  | Transform
  | Iter<T>
  | IStreamObject<T>
  | Promise<T>
