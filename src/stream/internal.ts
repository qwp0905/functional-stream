import {
  IFs,
  StreamLike,
  ISubject,
  IErrorCallback,
  IFilterCallback,
  IMapCallback,
  IReduceCallback,
  ITapCallback,
  OperatorPipe,
  IFunction1,
  IFunction0,
  EmptyPipelineError,
  IObserver,
  OperateOptions,
  IFunction2
} from "../@types/index.js"
import { Subject } from "../observer/index.js"
import {
  map,
  filter,
  reduce,
  bufferCount,
  take,
  onErrWith,
  defaultIfEmpty,
  throwIfEmpty,
  finalize,
  takeWhile,
  mergeScan,
  timeout,
  bufferWhen,
  mergeWith,
  raceWith,
  zipWith,
  repeat,
  sample,
  startWith,
  window,
  windowCount
} from "../operators/index.js"
import { Fs } from "./functional-stream.js"

export abstract class FsInternal<T> implements IFs<T> {
  protected constructor(protected source: ISubject<T>) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  protected pipe<R = T>(callback: OperatorPipe<T, R>): IFs<R> {
    return Fs.new((dest) => (dest.add(this.source), callback(this.source, dest)))
  }

  watch(options: IObserver<T>) {
    const [sub, out] = [new Subject<T>(), new Subject<T>()]
    sub.add(out)
    sub.add(this.source)
    out.watch(options)

    this.source.watch({
      next(event) {
        sub.publish(event), out.publish(event)
      },
      error(err) {
        sub.abort(err), out.abort(err)
      },
      complete() {
        sub.commit(), out.commit()
      }
    })

    this.source = sub
  }

  operate<R>({ destination, ...observer }: OperateOptions<T, R>): void {
    destination.add(this.source)
    this.source.watch(observer)
  }

  close(): void {
    return this.source.close()
  }

  lastOne(): Promise<T> {
    return new Promise((resolve, error) => {
      let result: T
      this.source.watch({
        next: (event) => (result = event),
        error,
        complete: () => resolve(result)
      })
    })
  }

  firstOne(): Promise<T> {
    return this.take(1).lastOne()
  }

  toArray(): Promise<T[]> {
    return this.reduce<T[]>((acc, cur) => acc.concat([cur]), []).lastOne()
  }

  forEach(callback: IMapCallback<T, any>): Promise<void> {
    return this.tap(callback).discard().lastOne()
  }

  count(): IFs<number> {
    return this.reduce((acc) => acc.add(1), 0)
  }

  some(callback: IFilterCallback<T>): IFs<boolean> {
    return this.filter(callback)
      .take(1)
      .map(() => true)
      .defaultIfEmpty(false)
  }

  every(callback: IFilterCallback<T>): IFs<boolean> {
    return this.filter((e, i) => !callback(e, i))
      .take(1)
      .map(() => false)
      .defaultIfEmpty(true)
  }

  map<R>(callback: IMapCallback<T, R>): IFs<R> {
    return this.pipe(map(callback))
  }

  filter(callback: IFilterCallback<T>): IFs<T> {
    return this.pipe(filter(callback))
  }

  tap(callback: ITapCallback<T>): IFs<T> {
    return this.map((e, i) => (callback(e, i), e))
  }

  reduce<A = T>(callback: IReduceCallback<A, T>, seed?: A): IFs<A> {
    return this.pipe(reduce({ callback, seed, emitNext: false, emitOnEnd: true }))
  }

  scan<A = T>(callback: IReduceCallback<A, T>, seed?: A): IFs<A> {
    return this.pipe(reduce({ callback, seed, emitNext: true, emitOnEnd: false }))
  }

  take(count: number): IFs<T> {
    return this.pipe(take(count))
  }

  skip(count: number): IFs<T> {
    return this.filter((_, i) => i.greaterThanOrEqual(count))
  }

  bufferCount(count: number): IFs<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(concurrency: number = Infinity): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeMap((e) => e as any, concurrency)
  }

  concatAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.mergeAll(1)
  }

  exhaustAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.exhaustMap((e) => e as any)
  }

  switchAll(): IFs<T extends StreamLike<infer K> ? K : never> {
    return this.switchMap((e) => e as any)
  }

  mergeMap<R>(callback: IMapCallback<T, StreamLike<R>>, concurrency: number = Infinity): IFs<R> {
    return this.mergeScan<R>((_, cur, index) => callback(cur, index), null as R, concurrency)
  }

  concatMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.mergeMap(callback, 1)
  }

  exhaustMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R> {
    let blocked = false
    return this.filter(() => !blocked)
      .tap(() => (blocked = true))
      .mergeMap((e, i) => Fs.from(callback(e, i)).finalize(() => (blocked = false)))
  }

  switchMap<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.switchScan((_, cur, i) => callback(cur, i), null as R)
  }

  switchScan<R>(callback: IReduceCallback<R, T, StreamLike<R>>, seed: R): IFs<R> {
    let current = 0
    return this.tap((_, i) => (current = i)).mergeScan(
      (acc, cur, i) => Fs.from(callback(acc, cur, i)).takeWhile(() => current.equal(i)),
      seed
    )
  }

  mergeScan<R>(
    callback: IReduceCallback<R, T, StreamLike<R>>,
    seed: R,
    concurrency = Infinity
  ): IFs<R> {
    return this.pipe(mergeScan(callback, seed, concurrency))
  }

  finalize(callback: IFunction0<void>): IFs<T> {
    return this.pipe(finalize(callback))
  }

  delay(ms: number): IFs<T> {
    return this.mergeMap((e) => Fs.delay(ms).map(() => e))
  }

  onErrWith(callback: IFunction1<unknown, StreamLike<T>>): IFs<T> {
    return this.pipe(onErrWith(callback))
  }

  catchErr(callback: IErrorCallback): IFs<T> {
    return this.onErrWith((err) => {
      return Fs.of(err)
        .tap((e) => callback(e))
        .discard()
    })
  }

  defaultIfEmpty(v: T): IFs<T> {
    return this.pipe(defaultIfEmpty(v))
  }

  throwIfEmpty(err: unknown = new EmptyPipelineError()): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: IMapCallback<T, R>): IFs<IFs<T>> {
    const map = new Map<R, ISubject<T>>()
    return this.map<[T, R]>((e, i) => [e, callback(e, i)])
      .tap(([e, k]) => map.get(k)?.publish(e))
      .filter(([, k]) => !map.has(k))
      .map(([e, k]) => Fs.new<T>((sub) => map.set(k, sub)).startWith(e))
      .catchErr((err) => map.forEach((s) => s.abort(err)))
      .finalize(() => (map.forEach((s) => s.commit()), map.clear()))
  }

  timeout(each: number): IFs<T> {
    return this.pipe(timeout(each))
  }

  startWith(v: T): IFs<T> {
    return this.pipe(startWith(v))
  }

  endWith(v: T): IFs<T> {
    return this.concatWith(Fs.of(v))
  }

  pairwise(): IFs<[T, T]> {
    return this.scan<any>(([, prev], e) => [prev, e], []).skip(1)
  }

  distinct<K>(callback: IMapCallback<T, K> = (e) => e as any): IFs<T> {
    return this.groupBy(callback).mergeMap((e) => e.take(1))
  }

  skipWhile(callback: IMapCallback<T, boolean>): IFs<T> {
    let started = false
    return this.tap((e, i) => (started ||= !callback(e, i))).filter(() => started)
  }

  takeWhile(callback: IMapCallback<T, boolean>): IFs<T> {
    return this.pipe(takeWhile(callback))
  }

  bufferTime(interval: number): IFs<T[]> {
    return this.bufferWhen(() => Fs.interval(interval))
  }

  skipLast(count: number): IFs<T> {
    const queue: T[] = []
    return this.tap((e) => queue.push(e))
      .skip(count)
      .map(() => queue.shift()!)
      .finalize(() => (queue.length = 0))
  }

  takeLast(count: number): IFs<T> {
    const len = count.minus().add(1)
    return this.reduce<T[]>((a, c) => a.slice(len).concat([c]), []).concatAll()
  }

  audit<R>(callback: IMapCallback<T, StreamLike<R>>): IFs<T> {
    let last: T
    return this.tap((e) => (last = e))
      .exhaustMap((e, i) => Fs.from(callback(e, i)).take(1))
      .map(() => last)
  }

  throttle<R>(callback: IFunction1<T, StreamLike<R>>): IFs<T> {
    return this.exhaustMap((e) => Fs.from(callback(e)).take(1).discard().startWith(e))
  }

  bufferWhen<R>(callback: IFunction0<StreamLike<R>>): IFs<T[]> {
    return this.pipe(bufferWhen(callback))
  }

  timestamp() {
    return this.map((value) => ({ timestamp: Date.now(), value }))
  }

  timeInterval() {
    return this.startWith(null as any)
      .timestamp()
      .pairwise()
      .map(([{ timestamp: p }, { value, timestamp: c }]) => ({ value, interval: c.subtract(p) }))
  }

  sample(notifier: StreamLike<any>): IFs<T> {
    return this.pipe(sample(notifier))
  }

  discard(): IFs<any> {
    return this.filter(() => false)
  }

  mergeWith(...streams: StreamLike<T>[]): IFs<T> {
    return this.pipe(mergeWith(streams, Infinity))
  }

  concatWith(...streams: StreamLike<T>[]): IFs<T> {
    return this.pipe(mergeWith(streams, 1))
  }

  raceWith(...streams: StreamLike<T>[]): IFs<T> {
    return this.pipe(raceWith(streams))
  }

  zipWith<R>(stream: StreamLike<R>): IFs<[T, R]>
  zipWith<R, E>(s1: StreamLike<R>, s2: StreamLike<E>): IFs<[T, R, E]>
  zipWith<R, E, W>(s1: StreamLike<R>, s2: StreamLike<E>, s3: StreamLike<W>): IFs<[T, R, E, W]>
  zipWith<R, Q, K, J>(
    s1: StreamLike<R>,
    s2: StreamLike<Q>,
    s3: StreamLike<K>,
    s4: StreamLike<J>
  ): IFs<[T, R, Q, K, J]>
  zipWith(...streams: StreamLike<any>[]): IFs<any[]> {
    return this.pipe(zipWith(streams))
  }

  repeat(count: number): IFs<T> {
    return this.pipe(repeat(count))
  }

  window<R>(stream: StreamLike<R>): IFs<IFs<T>> {
    return this.pipe(window(stream))
  }

  windowCount(count: number): IFs<IFs<T>> {
    return this.pipe(windowCount(count))
  }

  sequenceEqual(
    stream: StreamLike<T>,
    compare: IFunction2<T, T, boolean> = (a, b) => a === b
  ): IFs<boolean> {
    return this.zipWith(stream).every(([a, b]) => compare(a, b))
  }
}
