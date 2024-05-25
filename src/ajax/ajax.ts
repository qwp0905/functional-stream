import { IFs } from '../@types/stream.js'
import { Fs } from '../stream/functional-stream.js'
import { AjaxError } from './error.js'
import { AjaxConfig, HttpMethod, Request } from './request.js'
import { AjaxResponse } from './response.js'

export function fromAjax<T>(config: AjaxConfig): IFs<AjaxResponse<T>> {
  return Fs.generate((sub) => {
    const req = new Request(config)

    Promise.resolve()
      .then(async () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), req.getTimeout())
        const res = await fetch(req.getUrl(), {
          method: req.getMethod(),
          body: req.getBody(),
          headers: req.getHeaders(),
          signal: controller.signal
        })
        timeout.unref()

        if (!req.validate(res.status)) {
          return sub.abort(
            await AjaxError.parseFrom(`request failed with status ${res.status}`, res)
          )
        }

        sub.publish(await AjaxResponse.parseFrom<T>(res, req.getResponseType()))
        sub.commit()
      })
      .catch((err) => sub.abort(err))
  })
}

export class Ajax {
  static get<T = any>(url: string, config: Omit<AjaxConfig, 'method' | 'url'> = {}) {
    return this.request<T>(HttpMethod.get, { ...config, url })
  }

  static post<T = any>(
    url: string,
    data: any,
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(HttpMethod.post, { ...config, body: data, url })
  }

  static put<T = any>(
    url: string,
    data: any,
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(HttpMethod.put, { ...config, body: data, url })
  }

  static patch<T = any>(
    url: string,
    data: any,
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(HttpMethod.patch, { ...config, body: data, url })
  }

  static delete<T = any>(url: string, config: Omit<AjaxConfig, 'method' | 'url'> = {}) {
    return this.request<T>(HttpMethod.get, { ...config, url })
  }

  private static request<T>(method: HttpMethod, config: Omit<AjaxConfig, 'method'>) {
    return fromAjax<T>({ ...config, method })
  }
}
