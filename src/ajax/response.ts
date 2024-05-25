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
  const content_type = res.headers.get('content-type')
  const charset = content_type?.replace(/^.*charset=([^;]*);?.*$/i, '$1')

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
      const decoder = new TextDecoder(charset)
      return Fs.from(res.body).map((e) => decoder.decode(e.buffer, { stream: true }))
  }

  if (!content_type) {
    return res.text()
  }

  if (/application\/json/i.test(content_type)) {
    return res.json()
  }

  if (/application\/octet-stream/i.test(content_type)) {
    const decoder = new TextDecoder(charset)
    return Fs.from(res.body).map((e) => decoder.decode(e.buffer, { stream: true }))
  }

  if (/application\/x-www-form-urlencode/i.test(content_type)) {
    const body: Record<string, string> = {}
    for (const [k, v] of new URLSearchParams(await res.text()).entries()) {
      body[k] = v
    }
    return body
  }

  if (/multipart\/formed-data/i.test(content_type)) {
    return res.formData()
  }

  return res.text()
}
