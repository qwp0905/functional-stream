import {
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback
} from './callback.js'
import { Closable, ISubject } from './observer.js'

export interface IStreamReadOptions<T> {
  next(data: T): any
  error?(err: Error): any
  complete?(): any
}

export interface IFs<T> extends Closable<T> {
  watch(options: IStreamReadOptions<T>): void
  close(): void
  lastOne(): Promise<T>
  firstOne(): Promise<T>
  toArray(): Promise<T[]>
  forEach(callback: TMapCallback<T, any>): Promise<void>

  count(): IFs<number>
  some(callback: TFilterCallback<T>): IFs<boolean>
  every(callback: TFilterCallback<T>): IFs<boolean>
  map<R>(callback: TMapCallback<T, R>): IFs<R>
  filter(callback: TFilterCallback<T>): IFs<T>
  tap(callback: TTapCallback<T>): IFs<T>
  reduce(callback: TReduceCallback<T, T>): IFs<T>
  reduce<A = T>(callback: TReduceCallback<A, T>, seed: A): IFs<A>
  scan(callback: TReduceCallback<T, T>): IFs<T>
  scan<A = T>(callback: TReduceCallback<A, T>, seed?: A): IFs<A>
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
  catchError(callback: TErrorCallback): IFs<T>
  copy(count: number): IFs<T>[]
  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>>
  defaultIfEmpty(v: T): IFs<T>
  throwIfEmpty(err?: unknown): IFs<T>
  timeout(each: number): IFs<T>
  startWith(v: T): IFs<T>
  endWith(v: T): IFs<T>
  pairwise(): IFs<[T, T]>
  split(delimiter: string): IFs<T extends string ? string : never>
  distinct<K>(callback?: TMapCallback<T, K>): IFs<T>
  takeWhile(callback: TMapCallback<T, boolean>): IFs<T>
  skipWhile(callback: TMapCallback<T, boolean>): IFs<T>
  takeLast(count: number): IFs<T>
  skipLast(count: number): IFs<T>
  timeInterval(): IFs<number>
  mergeScan<R>(
    callback: TReduceCallback<R, T, StreamLike<R>>,
    seed: R,
    concurrency?: number
  ): IFs<R>
  switchScan<R>(callback: TReduceCallback<R, T, StreamLike<R>>, seed: R): IFs<R>
  audit<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<T>
  throttle<R>(callback: (arg: T) => StreamLike<R>): IFs<T>
  bufferWhen<R>(callback: () => StreamLike<R>): IFs<T[]>
  timestamp(): IFs<number>
  throwError<Err = unknown>(factory: Err | (() => Err)): IFs<T>
  sample(notifier: StreamLike<any>): IFs<T>
  discard(): IFs<any>
  mergeWith(...streams: StreamLike<T>[]): IFs<T>
  concatWith(...streams: StreamLike<T>[]): IFs<T>
  raceWith(...streams: StreamLike<T>[]): IFs<T>
  zipWith<R>(stream: StreamLike<R>): IFs<[T, R]>
  zipWith<R, Q>(s1: StreamLike<R>, s2: StreamLike<Q>): IFs<[T, R, Q]>
  zipWith<R, Q, K>(s1: StreamLike<R>, s2: StreamLike<Q>, s3: StreamLike<K>): IFs<[T, R, Q, K]>
  zipWith<R, Q, K, J>(
    s1: StreamLike<R>,
    s2: StreamLike<Q>,
    s3: StreamLike<K>,
    s4: StreamLike<J>
  ): IFs<[T, R, Q, K, J]>
  zipWith(...streams: StreamLike<any>[]): IFs<any[]>
}

export type StreamLike<T> =
  | ReadableStream<T>
  | AsyncIterable<T>
  | Iterable<T>
  | IFs<T>
  | ISubject<T>
  | Promise<T>

export type OperatorPipe<T, R = T> = (source: ISubject<T>) => (dest: ISubject<R>) => void
