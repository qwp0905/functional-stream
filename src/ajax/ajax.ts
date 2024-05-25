import { IFs } from '../@types/index.js'
import { Fs } from '../stream/functional-stream.js'
import { AjaxError } from './error.js'
import { AjaxConfig, AjaxRequest } from './request.js'
import { AjaxResponse } from './response.js'

export function fromAjax<T>(config: AjaxConfig): IFs<AjaxResponse<T>> {
  return Fs.generate((sub) => {
    const req = new AjaxRequest(config)

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

        const parsed = await AjaxResponse.parseFrom<T>(res, req.getResponseType())
        if (!req.validate(parsed.getStatus())) {
          return sub.abort(
            new AjaxError(`request failed with status ${res.status}`, parsed)
          )
        }

        sub.publish(parsed)
      })
      .catch((err) => sub.abort(err))
      .finally(() => sub.commit())
  })
}
