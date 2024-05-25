import { IFs } from '../@types/stream.js'
import { Fs } from '../stream/functional-stream.js'
import { AjaxError } from './error.js'
import { AjaxConfig, Request } from './request.js'
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
