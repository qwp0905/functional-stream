export type OrPromise<T> = T | Promise<T>

export interface IFunction0<Return> {
  (): Return
}
export interface IFunction1<Arg1, Return> {
  (arg: Arg1): Return
}
export interface IFunction2<Arg1, Arg2, Return> {
  (arg: Arg1, arg2: Arg2): Return
}
export interface IFunction3<Arg1, Arg2, Arg3, Return> {
  (arg: Arg1, arg2: Arg2, arg3: Arg3): Return
}

export interface IAnyCallback extends IFunction0<any> {}
export interface IErrorCallback extends IFunction1<unknown, OrPromise<void>> {}
export interface IMapCallback<T, R> extends IFunction2<T, number, R> {}
export interface ITapCallback<T> extends IMapCallback<T, void> {}
export interface IFilterCallback<T> extends IMapCallback<T, boolean> {}
export interface IReduceCallback<A, C, R = A> extends IFunction3<A, C, number, R> {}
