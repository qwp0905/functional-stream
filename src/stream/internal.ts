import {
  IFs,
  IStreamReadOptions,
  StreamLike,
  IPipeline,
  ISubject,
  TAnyCallback,
  TErrorCallback,
  TFilterCallback,
  TMapCallback,
  TReduceCallback,
  TTapCallback,
  OperatorPipe
} from '../@types/index.js'
import { Subject } from '../observer/index.js'
import { SubscriptionTimeoutError, EmptyPipelineError, isFunction } from '../utils/index.js'
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
  mergeScan
} from '../operators/index.js'
import { Fs } from './functional-stream.js'

export class FsInternal<T> implements IFs<T> {
  protected constructor(protected source: ISubject<T>) {}

  [Symbol.asyncIterator]() {
    return this.source[Symbol.asyncIterator]()
  }

  protected pipeTo<R>(generator: (sub: ISubject<R>) => void): IFs<R> {
    const sub = new Subject<R>()
    sub.add(this.source)
    generator(sub)
    return new FsInternal(sub)
  }

  protected pipe<R = T>(callback: OperatorPipe<T, R>): IFs<R> {
    return Fs.generate((dest) => {
      dest.add(this.source)
      callback(this.source)(dest)
    })
  }

  protected copyTo(sub: ISubject<T>): IFs<T> {
    sub.add(this.source)
    return new FsInternal<T>(sub)
  }

  protected iter(): AsyncIterator<T> {
    return this[Symbol.asyncIterator]()
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
    return this.filter((_, i) => i.greaterThanOrEqual(count))
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

  copy(count: number): IFs<T>[] {
    const sub = new Array(count).fill(null).map(() => new Subject<T>())
    this.source.watch({
      next(data) {
        sub.forEach((s) => s.publish(data))
      },
      error(err) {
        sub.forEach((s) => s.abort(err))
      },
      complete() {
        sub.forEach((s) => s.commit())
      }
    })
    return sub.map((s) => this.copyTo(s))
  }

  defaultIfEmpty(v: T): IFs<T> {
    return this.pipe(defaultIfEmpty(v))
  }

  throwIfEmpty(err: unknown = new EmptyPipelineError()): IFs<T> {
    return this.pipe(throwIfEmpty(err))
  }

  groupBy<R>(callback: TMapCallback<T, R>): IFs<IFs<T>> {
    const map = new Map<R, Subject<T>>()
    return this.map<[T, R]>((e, i) => [e, callback(e, i)])
      .tap(([e, k]) => map.get(k)?.publish(e))
      .filter(([, k]) => !map.has(k))
      .map(([e, k]) => {
        const sub = new Subject<T>()
        map.set(k, sub)
        return Fs.from(sub).startWith(e)
      })
      .catchError((err) => map.forEach((s) => s.abort(err)))
      .finalize(() => map.forEach((s) => s.commit()))
      .finalize(() => map.clear())
  }

  timeout(each: number): IFs<T> {
    return this.pipeTo((sub) => {
      const timeout = setTimeout(() => sub.abort(new SubscriptionTimeoutError()), each)
      sub.add(() => timeout.unref())
      return this.tap(() => timeout.refresh())
        .tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }

  startWith(v: T): IFs<T> {
    return this.pipeTo((sub) => {
      sub.publish(v)
      return this.tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
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
    let blocked = false
    return this.tap((e) => (last = e))
      .filter(() => !blocked)
      .tap(() => (blocked = true))
      .mergeMap((e, i) => Fs.from(callback(e, i)).take(1))
      .map(() => last)
      .tap(() => (blocked = false))
  }

  throttle<R>(callback: (arg: T) => StreamLike<R>): IFs<T> {
    let blocked = false
    return this.filter(() => !blocked)
      .tap(() => (blocked = true))
      .mergeMap((e) =>
        Fs.from<T>(callback(e) as any)
          .startWith(e)
          .takeWhile((_, i) => i.equal(0))
          .finalize(() => (blocked = false))
      )
  }

  bufferWhen<R>(callback: () => StreamLike<R>): IFs<T[]> {
    return this.pipeTo((sub) => {
      let queue: T[] = []
      let done = false
      this.source.watch({
        next(data) {
          queue.push(data)
        },
        error(err) {
          sub.abort(err)
        },
        complete() {
          done = true
        }
      })

      return Fs.from(callback())
        .tap(() => sub.publish(queue))
        .tap(() => (queue = []))
        .takeWhile(() => !done)
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }

  timestamp(): IFs<number> {
    return this.map(() => Date.now())
  }

  timeInterval(): IFs<number> {
    return this.timestamp()
      .pairwise()
      .map(([prev, cur]) => cur.subtract(prev))
  }

  throwError(factory: unknown | (() => unknown)): IFs<T> {
    return this.tap(() => {
      throw (isFunction(factory) && factory()) || factory
    })
  }

  sample(notifier: StreamLike<any>): IFs<T> {
    return this.bufferWhen(() => notifier)
      .filter((e) => e.length.greaterThan(0))
      .map((e) => e.at(-1)!)
  }

  discard(): IFs<any> {
    return this.filter(() => false)
  }

  mergeWith(...streams: StreamLike<T>[]): IFs<T> {
    const s = streams.map((e) => Fs.from(e))
    return this.pipeTo((sub) => {
      s.forEach((e) => sub.add(() => e.close()))
      return Fs.from(s)
        .startWith(this)
        .mergeAll()
        .tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }

  concatWith(...streams: StreamLike<T>[]): IFs<T> {
    const s = streams.map((e) => Fs.from(e))
    return this.pipeTo((sub) => {
      s.forEach((e) => sub.add(() => e.close()))
      return Fs.from(s)
        .startWith(this)
        .concatAll()
        .tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }

  raceWith(...streams: StreamLike<T>[]): IFs<T> {
    return this.pipeTo((sub) => {
      const s = streams.map((e) => Fs.from(e))
      s.forEach((e) => sub.add(() => e.close()))
      let first = false
      return Fs.from(s)
        .startWith(this)
        .mergeMap((e) => {
          if (first) {
            e.close()
            return Fs.empty<T>()
          }

          first = true
          return e
        })
        .tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }

  zipWith(...streams: StreamLike<any>[]): IFs<any[]> {
    return this.pipeTo(async (sub) => {
      const s = streams.map((e) => Fs.from(e) as Fs<any>)
      s.forEach((e) => sub.add(() => e.close()))
      const iters = [this as Fs<any>].concat(s).map((e) => e.iter())
      const next = () => Promise.all(iters.map((e) => e.next()))
      return Fs.loop(
        await next(),
        (data) => data.some((e) => !e.done),
        () => next()
      )
        .map((data) => data.map((e) => e.value))
        .tap((e) => sub.publish(e))
        .catchError((err) => sub.abort(err))
        .finalize(() => sub.commit())
        .lastOne()
    })
  }
}
