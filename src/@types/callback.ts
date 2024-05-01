export type TFilterCallback<T> = (arg: T, index: number) => boolean

export type TMapCallback<T, R> = (arg: T, index: number) => R

export type TTapCallback<T> = (arg: T, index: number) => void

export type TReduceCallback<A, C> = (acc: A, cur: C, index: number) => A

export type TAnyCallback = () => any

export type TVoidCallback = () => void | Promise<void>

export type TErrorCallback = (err: unknown) => void | Promise<void>
