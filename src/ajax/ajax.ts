import { IFs } from '../@types/index.js'
import { Fs } from '../stream/index.js'
import { AjaxError } from './error.js'
import { AjaxRequestConfig, AjaxRequest } from './request.js'
import { AjaxResponse } from './response.js'

export function fromAjax<T>(config: AjaxRequestConfig): IFs<AjaxResponse<T>> {
  return Fs.generate(async (sub) => {
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

      const parsed = await AjaxResponse.parseFrom<T>(res, req.getResponseType())
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
  })
}
