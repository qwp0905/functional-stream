export class AlreadySubscribedError extends Error {
  constructor() {
    super('already has a subscribed observer')
  }
}

export class NotSupportTypeError extends Error {
  constructor() {
    super('stream type is not supported')
  }
}
