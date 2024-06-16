import { Subject } from '../observer/index.js'
import { ajaxCall } from './ajax.js'
import { Duration } from '../utils/index.js'
import { AjaxRequestConfig, HttpMethod } from './request.js'
import { AjaxResponse } from './response.js'
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
  private readonly sub: ISubject<[ISubject<AjaxResponse<any>>, AjaxRequestConfig]> = new Subject()
  constructor(private readonly config: AjaxClientConfig) {
    if ((config.concurrency ?? 0).lessThanOrEqual(0)) {
      this.sub.watch({
        next([sub, conf]) {
          ajaxCall(conf, sub)
        }
      })
      return
    }

    const iter = this.sub[Symbol.asyncIterator]()
    Promise.all(
      new Array(config.concurrency).fill(null).map(async () => {
        for (let data = await iter.next(); !data.done; data = await iter.next()) {
          await ajaxCall(data.value[1], data.value[0])
        }
      })
    )
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

  protected request<T>(
    url: string,
    method: HttpMethod,
    config: AjaxConfig & Pick<AjaxRequestConfig, 'body'>
  ) {
    const merged = {
      ...config,
      method,
      headers: { ...(this.config.headers ?? {}), ...(config.headers ?? {}) },
      url: (this.config.base_url ?? '').concat(url),
      validate: config.validate ?? this.config.validate,
      timeout: config.timeout ?? this.config.timeout,
      user: config.user ?? this.config.user,
      password: config.password ?? this.config.password
    }

    return Fs.generate<AjaxResponse<T>>((sub) => this.sub.publish([sub, merged]))
  }

  close() {
    return this.sub.close()
  }
}

export const defaultAjaxClient = new AjaxClient({
  validate: (status) => status.lessThan(400),
  timeout: Duration.minute(2),
  concurrency: 512
})
