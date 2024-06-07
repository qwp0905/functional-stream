import { ISubject } from '../@types/index.js'
import { AjaxError, AjaxTimeoutError } from './error.js'
import { AjaxRequestConfig, AjaxRequest } from './request.js'
import { AjaxResponse } from './response.js'

export interface AjaxAdapter {
  dispatch(request: AjaxRequest, subject: ISubject<AjaxResponse<any>>): void
}

export async function ajaxCall(
  config: AjaxRequestConfig,
  subject: ISubject<AjaxResponse<any>>
) {
  try {
    const req = new AjaxRequest(config)
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort(new AjaxTimeoutError())
    }, req.getTimeout())
    subject.add(() => timeout.unref())

    const res = await fetch(req.getUrl(), {
      method: req.getMethod(),
      body: req.getBody(),
      headers: req.getHeaders(),
      signal: controller.signal
    })

    const parsed = await AjaxResponse.parseFrom(res, req.getResponseType())
    if (!req.validate(parsed.getStatus())) {
      return subject.abort(
        new AjaxError(`request failed with status ${parsed.getStatus()}`, parsed)
      )
    }

    subject.publish(parsed)
  } catch (err) {
    subject.abort(err)
  } finally {
    subject.commit()
  }
}
