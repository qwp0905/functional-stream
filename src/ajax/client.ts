import { ajaxCall } from './ajax.js'
import { Duration } from '../utils/index.js'
import { AjaxRequestConfig, HttpMethod } from './request.js'
import { AjaxResponse } from './response.js'
import { Subject } from '../observer/index.js'
import { ISubject } from '../@types/index.js'
import { Fs } from '../stream/index.js'

export interface AjaxClientConfig {
  readonly base_url?: string
  readonly timeout?: number
  readonly user?: string
  readonly password?: string
  readonly validate?: (status: number) => boolean
  readonly headers?: Record<string, string>
  readonly concurrency?: number
}

export interface AjaxConfig extends Omit<AjaxRequestConfig, 'method' | 'url' | 'body'> {}

export class AjaxClient {
  private readonly sub: ISubject<[string, AjaxRequestConfig]> = new Subject()
  private readonly map: Map<string, ISubject<AjaxResponse<any>>> = new Map()
  constructor(private readonly config: AjaxClientConfig) {
    Fs.from(this.sub)
      .mergeMap(
        ([key, config]) => ajaxCall(config, this.map.get(key)!),
        this.config.concurrency
      )
      .toPromise()
  }

  head(url: string, config: AjaxConfig) {
    return this.request<void>(url, HttpMethod.head, config)
  }

  get<T = any>(url: string, config: AjaxConfig = {}) {
    return this.request<T>(url, HttpMethod.get, config)
  }

  post<T = any>(url: string, data: any = {}, config: AjaxConfig = {}) {
    return this.request<T>(url, HttpMethod.post, { ...config, body: data })
  }

  put<T = any>(url: string, data: any = {}, config: AjaxConfig = {}) {
    return this.request<T>(url, HttpMethod.put, { ...config, body: data })
  }

  patch<T = any>(url: string, data: any = {}, config: AjaxConfig = {}) {
    return this.request<T>(url, HttpMethod.patch, { ...config, body: data })
  }

  delete<T = any>(url: string, config: AjaxConfig = {}) {
    return this.request<T>(url, HttpMethod.get, config)
  }

  private request<T>(
    url: string,
    method: HttpMethod,
    config: AjaxConfig & Pick<AjaxRequestConfig, 'body'>
  ) {
    return Fs.generate<AjaxResponse<T>>((sub) => {
      const key = btoa(`${Date.now()}${Math.random().toString(36).slice(2)}`)
      sub.add(() => this.map.delete(key))
      this.map.set(key, sub)
      this.sub.publish([
        key,
        {
          ...config,
          method,
          headers: Object.assign(this.config.headers ?? {}, config.headers),
          url: (this.config.base_url ?? '') + url,
          validate: config.validate ?? this.config.validate,
          timeout: config.timeout ?? this.config.timeout,
          user: config.user ?? this.config.user,
          password: config.password ?? this.config.password
        }
      ])
    })
  }
}

export const defaultAjaxClient = new AjaxClient({
  validate: (status) => status < 400,
  timeout: Duration.minute(2),
  concurrency: 512
})
