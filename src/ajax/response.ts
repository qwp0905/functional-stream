import { Fs } from '../stream/functional-stream.js'
import { ResponseType } from './request.js'

export class AjaxResponse<T> {
  constructor(
    private readonly status: number,
    private readonly body: T,
    private readonly headers: Record<string, string>
  ) {}

  getData(): T {
    return this.body
  }

  getStatus() {
    return this.status
  }

  getHeaders() {
    return this.headers
  }

  static async parseFrom<T>(response: Response, response_type?: ResponseType) {
    const headers: Record<string, string> = {}
    for (const [k, v] of response.headers.entries()) {
      headers[k] = v
    }
    return new AjaxResponse<T>(
      response.status,
      await getBody(response, response_type),
      headers
    )
  }
}

async function getBody(res: Response, type?: ResponseType): Promise<any> {
  if (!res.body) {
    return {}
  }

  const content_type_header = res.headers.get('content-type')?.split(';')
  const charset = content_type_header
    ?.find((e) => e.toLowerCase().startsWith('charset='))
    ?.replace(/^charset=/, '')
  const content_type = content_type_header?.find(
    (e) => !e.toLowerCase().startsWith('charset=')
  )

  switch (type) {
    case 'json':
      return res.json()
    case 'arraybuffer':
      return res.arrayBuffer()
    case 'text':
      return res.text()
    case 'blob':
      return res.blob()
    case 'stream':
      return Fs.from(res.body.pipeThrough(new TextDecoderStream(charset)))
  }

  switch (content_type) {
    case 'application/json':
      return res.json()
    case 'application/x-ndjson':
      return Fs.from(res.body.pipeThrough(new TextDecoderStream(charset))).split('\n')
    case 'application/octet-stream':
      return Fs.from(res.body.pipeThrough(new TextDecoderStream(charset)))
    case 'application/x-www-form-urlencode':
      const body: Record<string, string> = {}
      for (const [k, v] of new URLSearchParams(await res.text()).entries()) {
        body[k] = v
      }
      return body
    case 'multipart/formed-data':
      return res.formData()
    default:
      return res.text()
  }
}
