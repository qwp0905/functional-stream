import { AjaxError, AjaxResponse, Fs, ISubject, Subject } from '../index.js'
import { Duration } from '../utils/time.js'
import { fromAjax } from './ajax.js'
import { AjaxRequest, AjaxRequestConfig, HttpMethod } from './request.js'

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
  constructor(private readonly config: AjaxClientConfig = {}) {}

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
    return fromAjax<T>({
      ...config,
      method,
      headers: Object.assign(this.config.headers ?? {}, config.headers),
      url: (this.config.base_url ?? '') + url,
      validate: config.validate ?? this.config.validate,
      timeout: config.timeout ?? this.config.timeout,
      user: config.user ?? this.config.user,
      password: config.password ?? this.config.password
    })
  }
}

export const defaultAjaxClient = new AjaxClient({
  validate: (status) => status < 400,
  timeout: Duration.minute(2)
})

export class Client {
  private readonly sub: ISubject<[string, AjaxRequestConfig]> = new Subject()
  private readonly map: Map<string, ISubject<AjaxResponse<any>>> = new Map()
  constructor(private readonly config: AjaxClientConfig) {
    Fs.from(this.sub)
      .mergeMap(async ([key, config]) => {
        const sub = this.map.get(key)!
        try {
          const req = new AjaxRequest(config)
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), req.getTimeout())
          sub.add(() => timeout.unref())

          const res = await fetch(req.getUrl(), {
            method: req.getMethod(),
            body: req.getBody(),
            headers: req.getHeaders(),
            signal: controller.signal
          })

          const parsed = await AjaxResponse.parseFrom(res, req.getResponseType())
          if (!req.validate(parsed.getStatus())) {
            return sub.abort(
              new AjaxError(`request failed with status ${parsed.getStatus()}`, parsed)
            )
          }

          sub.publish(parsed)
        } catch (err) {
          sub.abort(err)
        } finally {
          sub.commit()
        }
      }, this.config.concurrency)
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
