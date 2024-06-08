import { Duration } from '../index.js'
import { BodyTypeNotSupportError } from './error.js'

const CHUNK_SIZE = 4096

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
    this.timeout = timeout ?? Duration.minute(2)
    this.validate = validate ?? ((status) => status.lessThan(400))

    if (user || password) {
      this.headers['Authorization'] =
        `Basic ${btoa((user ?? '').concat(':').concat(password ?? ''))}`
    }
  }

  getUrl(): string {
    const [base, params] = this.url.split('?')
    if (!params) {
      return base.concat('?').concat(new URLSearchParams(this.params).toString())
    }

    const p = new URLSearchParams(params)
    new URLSearchParams(this.params).forEach((v, k) => p.set(k, v))
    return base.concat('?').concat(p.toString())
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
      return sliceReader(this.body, this.body.length)
    }

    if (typeof FormData !== 'undefined' && this.body instanceof FormData) {
      return iterableReader(this.body)
    }

    if (typeof URLSearchParams !== undefined && this.body instanceof URLSearchParams) {
      return iterableReader(this.body)
    }

    if (isArrayBuffer(this.body)) {
      return sliceReader(this.body, this.body.byteLength)
    }

    if (isFile(this.body)) {
      return sliceReader(this.body, this.body.size)
    }

    if (isBlob(this.body)) {
      return sliceReader(this.body, this.body.size)
    }

    if (typeof ReadableStream !== undefined && this.body instanceof ReadableStream) {
      return this.body
    }

    if (typeof ArrayBuffer !== undefined && ArrayBuffer.isView(this.body)) {
      return sliceReader(this.body.buffer, this.body.buffer.byteLength)
    }

    if (typeof this.body === 'object') {
      this.headers['content-type'] =
        this.headers['content-type'] ?? 'application/json;utf-8'
      const marshaled = JSON.stringify(this.body)
      return sliceReader(marshaled, marshaled.length)
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

function isFile(data: any): data is File {
  return typeof File !== 'undefined' && toStringEq(data, 'File')
}

function isArrayBuffer(data: any): data is ArrayBuffer {
  return typeof ArrayBuffer !== 'undefined' && toStringEq(data, 'ArrayBuffer')
}

function isBlob(data: any): data is Blob {
  return typeof Blob !== 'undefined' && toStringEq(data, 'Blob')
}

interface Slice {
  slice(start: number, end: number): Slice
}

function sliceReader(buf: Slice, size: number) {
  if (typeof ReadableStream === 'undefined') {
    return buf
  }

  return new ReadableStream({
    start(controller) {
      for (let i = 0; i.lessThan(size); i += CHUNK_SIZE) {
        controller.enqueue(buf.slice(i, i.add(CHUNK_SIZE)))
      }
      controller.close()
    }
  })
}

function iterableReader(iter: Iterable<any>) {
  if (typeof ReadableStream === 'undefined') {
    return iter
  }

  return new ReadableStream({
    start(controller) {
      for (const chunk of iter) {
        controller.enqueue(chunk)
      }
      controller.close()
    }
  })
}
