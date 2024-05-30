export class Duration {
  static millisecond(n?: number) {
    return n ?? 1
  }

  static second(n?: number) {
    return this.millisecond(1000) * (n ?? 1)
  }

  static minute(n?: number) {
    return this.second(60) * (n ?? 1)
  }

  static hour(n?: number) {
    return this.minute(60) * (n ?? 1)
  }

  static day(n?: number) {
    return this.hour(24) * (n ?? 1)
  }
}
