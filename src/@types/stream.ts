import {
  IFunction0,
  IErrorCallback,
  IFilterCallback,
  IMapCallback,
  IFunction1,
  IReduceCallback,
  ITapCallback,
  IFunction2
} from "./callback.js"
import { Closable, ISubject } from "./observer.js"

export interface IStreamReadOptions<T> {
  next(data: T): any
  error?(err: Error): any
  complete?(): any
}

export interface Timestamp<T> {
  value: T
  timestamp: number
}
export interface TimeInterval<T> {
  value: T
  interval: number
}

export interface IFs<T> extends Closable<T> {
  watch(options: IStreamReadOptions<T>): void
  close(): void
  lastOne(): Promise<T>
  firstOne(): Promise<T>
  toArray(): Promise<T[]>
  forEach(callback: IMapCallback<T, any>): Promise<void>

  count(): IFs<number>
  some(callback: IFilterCallback<T>): IFs<boolean>
  every(callback: IFilterCallback<T>): IFs<boolean>
  map<R>(callback: IMapCallback<T, R>): IFs<R>
  filter(callback: IFilterCallback<T>): IFs<T>
  tap(callback: ITapCallback<T>): IFs<T>
  reduce(callback: IReduceCallback<T, T>): IFs<T>
  reduce<A = T>(callback: IReduceCallback<A, T>, seed: A): IFs<A>
  scan(callback: IReduceCallback<T, T>): IFs<T>
  scan<A = T>(callback: IReduceCallback<A, T>, seed?: A): IFs<A>
  take(count: number): IFs<T>
  skip(count: number): IFs<T>
  bufferCount(count: number): IFs<T[]>
  bufferTime(interval: number): IFs<T[]>
  mergeAll(concurrency?: number): IFs<T extends StreamLike<infer K> ? K : never>
  concatAll(): IFs<T extends StreamLike<infer K> ? K : never>
  exhaustAll(): IFs<T extends StreamLike<infer K> ? K : never>
  switchAll(): IFs<T extends StreamLike<infer K> ? K : never>
  mergeMap<R>(callback: IMapCallback<T, StreamLike<R>>, concurrency?: number): IFs<R>
  concatMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R>
  exhaustMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R>
  switchMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R>
  finalize(callback: IFunction0<void>): IFs<T>
  delay(ms: number): IFs<T>
  onErrWith(callback: IFunction1<unknown, StreamLike<T>>): IFs<T>
  catchErr(callback: IErrorCallback): IFs<T>
  groupBy<R>(callback: IMapCallback<T, R>): IFs<IFs<T>>
  defaultIfEmpty(v: T): IFs<T>
  throwIfEmpty(err?: unknown): IFs<T>
  timeout(each: number): IFs<T>
  startWith(v: T): IFs<T>
  endWith(v: T): IFs<T>
  pairwise(): IFs<[T, T]>
  distinct<K>(callback?: IMapCallback<T, K>): IFs<T>
  takeWhile(callback: IMapCallback<T, boolean>): IFs<T>
  skipWhile(callback: IMapCallback<T, boolean>): IFs<T>
  takeLast(count: number): IFs<T>
  skipLast(count: number): IFs<T>
  timeInterval(): IFs<TimeInterval<T>>
  mergeScan<R>(
    callback: IReduceCallback<R, T, StreamLike<R>>,
    seed: R,
    concurrency?: number
  ): IFs<R>
  switchScan<R>(callback: IReduceCallback<R, T, StreamLike<R>>, seed: R): IFs<R>
  audit<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<T>
  throttle<R>(callback: IFunction1<T, StreamLike<R>>): IFs<T>
  bufferWhen<R>(callback: IFunction0<StreamLike<R>>): IFs<T[]>
  timestamp(): IFs<Timestamp<T>>
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
  repeat(count: number): IFs<T>
}

export type StreamLike<T> =
  | ReadableStream<T>
  | AsyncIterable<T>
  | Iterable<T>
  | IFs<T>
  | ISubject<T>
  | Promise<T>

export interface OperatorPipe<T, R = T> extends IFunction2<ISubject<T>, ISubject<R>, void> {}
