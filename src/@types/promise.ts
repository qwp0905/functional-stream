import { IFunction1, OrPromise } from "./callback.js"

export interface ResolveFunction<T> extends IFunction1<OrPromise<IteratorResult<T>>, void> {}
export interface RejectFunction extends IFunction1<any, void> {}
