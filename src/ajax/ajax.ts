import { IFs } from '../@types/stream.js'
import { Fs } from '../stream/functional-stream.js'
import { RequestTimeoutError } from './error.js'
import { AjaxConfig, Request } from './request.js'
import { AjaxResponse } from './response.js'

export function fromAjax<T>(config: AjaxConfig): IFs<AjaxResponse<T>> {
  return Fs.generate((sub) => {
    const req = new Request(config)
    const xhr = new XMLHttpRequest()

    xhr.addEventListener('load', () => {
      sub.publish(new AjaxResponse(xhr))
      sub.commit()
    })

    xhr.addEventListener('timeout', () => sub.abort(new RequestTimeoutError()))
    xhr.addEventListener('abort', () => {})
    xhr.addEventListener('error', () => {})

    const body = req.getBody()
    const headers = req.getHeaders()

    xhr.responseType = req.getResponseType()
    xhr.timeout = req.getTimeout()

    xhr.open(req.getMethod(), req.getUrl(), true, req.getUser(), req.getPassword())
    for (const key in headers) {
      xhr.setRequestHeader(key, headers[key])
    }
    xhr.send(body)
  })
}
