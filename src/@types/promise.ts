export type ResolveFunction<T> = (v: IteratorResult<T> | PromiseLike<IteratorResult<T>>) => void
export type RejectFunction = (reason: any) => void
