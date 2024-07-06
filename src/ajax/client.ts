import { Subject } from "../observer/index.js"
import { ajaxCall } from "./ajax.js"
import { Duration } from "../utils/index.js"
import { AjaxRequestConfig, HttpMethod } from "./request.js"
import { AjaxResponse } from "./response.js"
import { IFunction1, ISubject } from "../@types/index.js"
import { Fs } from "../stream/index.js"

export interface AjaxClientConfig {
  readonly base_url?: string
  readonly timeout?: number
  readonly user?: string
  readonly password?: string
  readonly validate?: IFunction1<number, boolean>
  readonly headers?: Record<string, string>
  readonly concurrency?: number
}

export interface AjaxConfig extends Omit<AjaxRequestConfig, "method" | "url" | "body"> {}

export class AjaxClient {
  private sub: ISubject<[ISubject<AjaxResponse<any>>, AjaxRequestConfig]> | null = null

  constructor(private readonly config: AjaxClientConfig) {}

  head(url: string, config: AjaxConfig = {}) {
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
    config: AjaxConfig & Pick<AjaxRequestConfig, "body">
  ) {
    if (!this.sub) {
      Fs.from((this.sub = new Subject()))
        .mergeMap(([sub, conf]) => ajaxCall(conf, sub), this.config.concurrency)
        .lastOne()
    }

    const merged = {
      ...config,
      method,
      headers: { ...(this.config.headers ?? {}), ...(config.headers ?? {}) },
      url: (this.config.base_url ?? "").concat(url),
      validate: config.validate ?? this.config.validate,
      timeout: config.timeout ?? this.config.timeout,
      user: config.user ?? this.config.user,
      password: config.password ?? this.config.password
    }

    return Fs.new<AjaxResponse<T>>((sub) => this.sub!.publish([sub, merged]))
  }

  close() {
    return this.sub?.commit()
  }
}

export const defaultAjaxClient = new AjaxClient({
  validate: (status) => status.lessThan(400),
  timeout: Duration.minute(2),
  concurrency: 512
})
