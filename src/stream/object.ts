import {
  PassThrough,
  Transform,
  TransformOptions,
  Writable,
  WritableOptions
} from 'stream'

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

export class ObjectWritable extends Writable {
  constructor(options: WritableOptions) {
    super({ objectMode: true, ...options })
  }
}
