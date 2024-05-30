import { BodyTypeNotSupportError } from './error.js'

export type ResponseType = 'arraybuffer' | 'blob' | 'json' | 'text' | 'stream'

export enum HttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
  head = 'head'
}

export interface AjaxRequestConfig {
  url: string
  method: HttpMethod
  body?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  responseType?: ResponseType
  timeout?: number
  user?: string
  password?: string
  validate?: (status: number) => boolean
}

export class AjaxRequest {
  private readonly url: string
  private readonly method: HttpMethod
  private readonly body?: any
  private readonly params: Record<string, any>
  private readonly headers: Record<string, string>
  private readonly responseType?: ResponseType
  private readonly timeout: number
  readonly validate: (status: number) => boolean

  constructor({
    url,
    method,
    body,
    params,
    headers,
    responseType,
    timeout,
    validate,
    user,
    password
  }: AjaxRequestConfig) {
    this.url = url
    this.method = method
    this.body = body
    this.params = params || {}
    this.headers = headers || {}
    this.responseType = responseType
    this.timeout = timeout ?? 120 * 1000
    this.validate = validate ?? ((status) => status < 400)

    if (user || password) {
      this.headers['Authorization'] =
        `Basic ${btoa((user ?? '') + ':' + (password ?? ''))}`
    }
  }

  getUrl(): string {
    const [base, params] = this.url.split('?')
    if (!params) {
      return base + '?' + new URLSearchParams(this.params)
    }

    const p = new URLSearchParams(params)
    new URLSearchParams(this.params).forEach((v, k) => p.set(k, v))
    return base + '?' + p
  }

  getMethod(): HttpMethod {
    return this.method
  }

  getHeaders(): Record<string, string> {
    return this.headers
  }

  getBody() {
    if (!this.body) {
      return
    }

    if (typeof this.body === 'string') {
      return this.body
    }

    if (typeof FormData !== 'undefined' && this.body instanceof FormData) {
      return this.body
    }

    if (typeof URLSearchParams !== undefined && this.body instanceof URLSearchParams) {
      return this.body
    }

    if (toStringEq(this.body, 'ArrayBuffer')) {
      return this.body
    }

    if (toStringEq(this.body, 'File')) {
      return this.body
    }

    if (toStringEq(this.body, 'Blob')) {
      return this.body
    }

    if (typeof ReadableStream !== undefined && this.body instanceof ReadableStream) {
      return this.body
    }

    if (typeof ArrayBuffer !== undefined && ArrayBuffer.isView(this.body)) {
      return this.body.buffer
    }

    if (typeof this.body === 'object') {
      this.headers['content-type'] =
        this.headers['content-type'] ?? 'application/json;utf-8'
      return JSON.stringify(this.body)
    }

    throw new BodyTypeNotSupportError()
  }

  getResponseType() {
    return this.responseType
  }

  getTimeout() {
    return this.timeout
  }
}

function toStringEq(data: any, type: string) {
  return Object.prototype.toString.call(data) === `[object ${type}]`
}