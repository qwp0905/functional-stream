import {
  IFs,
  IStreamReadOptions,
  StreamLike,
  ISubject,
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback,
  OperatorPipe
} from "../@types/index.js"
import { Subject } from "../observer/index.js"
import { EmptyPipelineError } from "../utils/index.js"
import {
  map,
  filter,
  reduce,
  bufferCount,
  take,
  catchError,
  defaultIfEmpty,
  throwIfEmpty,
  split,
  finalize,
  takeWhile,
  mergeScan,
  timeout,
  bufferWhen,
  mergeWith,
  raceWith,
  zipWith,
  repeat,
  sample
} from "../operators/index.js"
import { Fs } from "./functional-stream.js"

export abstract class FsInternal<T> implements IFs<T> {
  protected constructor(protected source: ISubject<T>) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  protected pipe<R = T>(callback: OperatorPipe<T, R>): IFs<R> {
    return Fs.new((dest) => {
      dest.add(this.source)
      callback(this.source)(dest)
    })
  }

  watch(options: IStreamReadOptions<T>) {
    const [sub, out] = [new Subject<T>(), new Subject<T>()]
    sub.add(out)
    sub.add(this.source)
    out.watch(options)

    this.source.watch({
      next(event) {
        sub.publish(event)
        out.publish(event)
      },
      error(err) {
        sub.abort(err)
        out.abort(err)
      },
      complete() {
        sub.commit()
        out.commit()
      }
    })

    this.source = sub
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

  forEach(callback: TMapCallback<T, any>): Promise<void> {
    return this.tap(callback).discard().lastOne()
  }

  count(): IFs<number> {
    return this.reduce((acc) => acc.add(1), 0)
  }

  some(callback: TFilterCallback<T>): IFs<boolean> {
    return this.filter(callback)
      .take(1)
      .map(() => true)
      .defaultIfEmpty(false)
  }

  every(callback: TFilterCallback<T>): IFs<boolean> {
    return this.filter((e, i) => !callback(e, i))
      .take(1)
      .map(() => false)
      .defaultIfEmpty(true)
  }

  map<R>(callback: TMapCallback<T, R>): IFs<R> {
    return this.pipe(map(callback))
  }

  filter(callback: TFilterCallback<T>): IFs<T> {
    return this.pipe(filter(callback))
  }

  tap(callback: TTapCallback<T>): IFs<T> {
    return this.map((e, i) => {
      callback(e, i)
      return e
    })
  }

  reduce<A = T>(callback: TReduceCallback<A, T>, seed?: A): IFs<A> {
    return this.pipe(reduce(callback, seed))
  }

  scan<A = T>(callback: TReduceCallback<A, T>, seed?: A): IFs<A> {
    return this.map(
      (e, i) => (seed = (i.equal(0) && seed === undefined && (e as any)) || callback(seed!, e, i))
    )
  }

  take(count: number): IFs<T> {
    return this.pipe(take(count))
  }

  skip(count: number): IFs<T> {
    return this.filter((_, i) => !i.lessThan(count))
  }

  bufferCount(count: number): IFs<T[]> {
    return this.pipe(bufferCount(count))
  }

  mergeAll(concurrency: number = -1): IFs<T extends StreamLike<infer K> ? K : never> {
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

  mergeMap<R>(callback: TMapCallback<T, StreamLike<R>>, concurrency: number = -1): IFs<R> {
    return this.mergeScan<R>((_, cur, index) => callback(cur, index), null as R, concurrency)
  }

  concatMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.mergeMap(callback, 1)
  }

  exhaustMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    let blocked = false
    return this.filter(() => !blocked)
      .tap(() => (blocked = true))
      .mergeMap((e, i) => Fs.from(callback(e, i)).finalize(() => (blocked = false)))
  }

  switchMap<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<R> {
    return this.switchScan((_, cur, i) => callback(cur, i), null as R)
  }

  switchScan<R>(callback: TReduceCallback<R, T, StreamLike<R>>, seed: R): IFs<R> {
    let current = 0
    return this.tap((_, i) => (current = i)).mergeScan(
      (acc, cur, i) => Fs.from(callback(acc, cur, i)).filter(() => current.equal(i)),
      seed
    )
  }

  mergeScan<R>(
    callback: (acc: R, cur: T, index: number) => StreamLike<R>,
    seed: R,
    concurrency = -1
  ): IFs<R> {
    return this.pipe(mergeScan(callback, seed, concurrency))
  }

  finalize(callback: TAnyCallback): IFs<T> {
    return this.pipe(finalize(callback))
  }

  delay(ms: number): IFs<T> {
    return this.mergeMap((e) => Fs.delay(ms).map(() => e))
  }

  catchError(callback: TErrorCallback): IFs<T> {
    return this.pipe(catchError(callback))
  }

  defaultIfEmpty(v: T): IFs<T> {
    return this.pipe(defaultIfEmpty(v))
  }

  throwIfEmpty(err: unknown = new EmptyPipelineError()): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    const map = new Map<R, ISubject<T>>()
    return this.map<[T, R]>((e, i) => [e, callback(e, i)])
      .tap(([e, k]) => map.get(k)?.publish(e))
      .filter(([, k]) => !map.has(k))
      .map(([e, k]) => Fs.new<T>((sub) => map.set(k, sub)).startWith(e))
      .catchError((err) => map.forEach((s) => s.abort(err)))
      .finalize(() => map.forEach((s) => s.commit()))
      .finalize(() => map.clear())
  }

  timeout(each: number): IFs<T> {
    return this.pipe(timeout(each))
  }

  startWith(v: T): IFs<T> {
    return Fs.of(v).concatWith(this)
  }

  endWith(v: T): IFs<T> {
    return this.concatWith(Fs.of(v))
  }

  pairwise(): IFs<[T, T]> {
    return this.scan<any>(([, prev], e) => [prev, e], []).skip(1)
  }

  split(delimiter: string) {
    return this.pipe(split(delimiter) as any) as any
  }

  distinct<K>(callback: TMapCallback<T, K> = (e) => e as any): IFs<T> {
    return this.groupBy(callback).mergeMap((e) => e.take(1))
  }

  skipWhile(callback: TMapCallback<T, boolean>): IFs<T> {
    let started = false
    return this.tap((e, i) => (started ||= !callback(e, i))).filter(() => started)
  }

  takeWhile(callback: TMapCallback<T, boolean>): IFs<T> {
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

  audit<R>(callback: TMapCallback<T, StreamLike<R>>): IFs<T> {
    let last: T
    return this.tap((e) => (last = e)).exhaustMap((e, i) =>
      Fs.from<any>(callback(e, i))
        .take(1)
        .map(() => last)
    )
  }

  throttle<R>(callback: (arg: T) => StreamLike<R>): IFs<T> {
    return this.exhaustMap((e) => Fs.from<any>(callback(e)).take(1).discard().startWith(e))
  }

  bufferWhen<R>(callback: () => StreamLike<R>): IFs<T[]> {
    return this.pipe(bufferWhen(callback))
  }

  timestamp() {
    return this.map((value) => ({ timestamp: Date.now(), value }))
  }

  timeInterval(): IFs<number> {
    return this.timestamp()
      .map(({ timestamp }) => timestamp)
      .startWith(Date.now())
      .pairwise()
      .map(([prev, cur]) => cur.subtract(prev))
  }

  sample(notifier: StreamLike<any>): IFs<T> {
    return this.pipe(sample(notifier))
  }

  discard(): IFs<any> {
    return this.filter(() => false)
  }

  mergeWith(...streams: StreamLike<T>[]): IFs<T> {
    return this.pipe(mergeWith(streams, -1))
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
}
