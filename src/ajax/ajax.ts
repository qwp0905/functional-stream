import { IFs } from '../@types/stream.js'
import { Fs } from '../stream/functional-stream.js'

export enum HttpMethod {
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
  head = 'head'
}

export interface AjaxConfig {
  url: string
  method: HttpMethod
  body?: any
  params?: Record<string, any>
  headers?: Record<string, string>
}

export class AjaxResponse<T> {
  constructor(private readonly xhr: XMLHttpRequest) {}

  get response(): T {
    return this.xhr.response
  }
}

export function fromAjax<T>(config: AjaxConfig): IFs<AjaxResponse<T>> {
  return Fs.generate((sub) => {
    const xhr = new XMLHttpRequest()
    const url = generateURL(config.url, config.params)
    xhr.responseType = 'arraybuffer'
    xhr.addEventListener('load', () => {
      sub.publish(new AjaxResponse(xhr))
      sub.commit()
    })
    xhr.open(config.method, url)
    xhr.send()
  })
}

function generateURL(url: string, query: Record<string, any> = {}): string {
  const [base, params] = url.split('?')
  if (!params) {
    return base + new URLSearchParams(query)
  }

  const p = new URLSearchParams(params)
  new URLSearchParams(query).forEach((v, k) => p.set(k, v))
  return base + p
}
