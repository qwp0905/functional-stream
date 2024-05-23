export class BodyTypeNotSupportError extends Error {
  constructor() {
    super('body type not support.')
  }
}

export class RequestTimeoutError extends Error {
  constructor() {
    super('request timeout.')
  }
}
