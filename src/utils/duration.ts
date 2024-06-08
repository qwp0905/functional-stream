export class Duration {
  static millisecond(n = 1) {
    return n
  }

  static second(n = 1) {
    return this.millisecond(1000).multiple(n)
  }

  static minute(n = 1) {
    return this.second(60).multiple(n)
  }

  static hour(n = 1) {
    return this.minute(60).multiple(n)
  }

  static day(n = 1) {
    return this.hour(24).multiple(n)
  }
}
