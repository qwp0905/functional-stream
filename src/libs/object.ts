import { PassThrough, Transform, TransformOptions } from 'stream'

export class ObjectPassThrough extends PassThrough {
  constructor(options: TransformOptions = {}) {
    super({ objectMode: true, ...options })
  }
}
export class ObjectTransform extends Transform {
  constructor(options: TransformOptions = {}) {
    super({ objectMode: true, ...options })
  }
}
