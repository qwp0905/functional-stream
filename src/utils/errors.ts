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

export class InvalidEventSourceError extends Error {
  constructor() {
    super('invalid event source')
  }
}

export class SubscriptionTimeoutError extends Error {
  constructor() {
    super('subscription timeout')
  }
}

export class BodyTypeNotSupportError extends Error {
  constructor() {
    super('body type not support')
  }
}
