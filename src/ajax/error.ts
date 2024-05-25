import { AjaxResponse } from './response.js'

export class BodyTypeNotSupportError extends Error {
  constructor() {
    super('body type not support.')
  }
}

export class AjaxError extends Error {
  constructor(
    message: string,
    public readonly response: AjaxResponse<any>
  ) {
    super(message)
  }
}
