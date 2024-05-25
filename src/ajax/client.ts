import { fromAjax } from './ajax.js'
import { AjaxConfig, HttpMethod } from './request.js'

export interface AjaxClientConfig {
  base_url?: string
  timeout?: number
  user?: string
  password?: string
  validate?: (status: number) => boolean
}

export class AjaxClient {
  constructor(private readonly config: AjaxClientConfig = {}) {}

  head(url: string, config: Omit<AjaxConfig, 'method' | 'url' | 'body'> = {}) {
    return this.request<void>(url, HttpMethod.head, config)
  }

  get<T = any>(url: string, config: Omit<AjaxConfig, 'method' | 'url' | 'body'> = {}) {
    return this.request<T>(url, HttpMethod.get, config)
  }

  post<T = any>(
    url: string,
    data: any = {},
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(url, HttpMethod.post, { ...config, body: data })
  }

  put<T = any>(
    url: string,
    data: any = {},
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(url, HttpMethod.put, { ...config, body: data })
  }

  patch<T = any>(
    url: string,
    data: any = {},
    config: Omit<AjaxConfig, 'method' | 'url'> = {}
  ) {
    return this.request<T>(url, HttpMethod.patch, { ...config, body: data })
  }

  delete<T = any>(url: string, config: Omit<AjaxConfig, 'method' | 'url' | 'body'> = {}) {
    return this.request<T>(url, HttpMethod.get, config)
  }

  private request<T>(
    url: string,
    method: HttpMethod,
    config: Omit<AjaxConfig, 'method' | 'url'>
  ) {
    return fromAjax<T>({
      ...config,
      method,
      url: (this.config.base_url ?? '') + url,
      validate: config.validate ?? this.config.validate,
      timeout: config.timeout ?? this.config.timeout,
      user: config.user ?? this.config.user,
      password: config.password ?? this.config.password
    })
  }
}

export const defaultAjaxClient = new AjaxClient({
  validate(status) {
    return status < 400
  },
  timeout: 120000
})
