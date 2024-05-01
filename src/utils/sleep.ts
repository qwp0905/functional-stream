export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const sleepWith = <T>(v: T, ms: number): Promise<T> => {
  return new Promise<T>((resolve) => setTimeout(() => resolve(v), ms))
}
