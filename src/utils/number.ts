declare global {
  interface Number {
    add(v: number): number
    subtract(v: number): number
    multiply(v: number): number
    divide(v: number): number
    remain(v: number): number
    power(v: number): number
    floor(): number
    ceil(): number
    round(): number
    equal(v: any): boolean
    greaterThan(v: number): boolean
    greaterThanOrEqual(v: number): boolean
    lessThan(v: number): boolean
    lessThanOrEqual(v: number): boolean
    isNaN(): boolean
    isFinite(): boolean
    max(v: number): number
    min(v: number): number
    minus(): number
    absolute(): number
  }
}
Number.prototype.add = function (v) {
  return this.valueOf() + v
}
Number.prototype.subtract = function (v) {
  return this.valueOf() - v
}
Number.prototype.multiply = function (v) {
  return this.valueOf() * v
}
Number.prototype.divide = function (v) {
  return this.valueOf() / v
}
Number.prototype.remain = function (v) {
  return this.valueOf() % v
}
Number.prototype.power = function (v) {
  return Math.pow(this.valueOf(), v)
}
Number.prototype.floor = function () {
  return Math.floor(this.valueOf())
}
Number.prototype.ceil = function () {
  return Math.ceil(this.valueOf())
}
Number.prototype.round = function () {
  return Math.round(this.valueOf())
}
Number.prototype.equal = function (v) {
  return this.valueOf() === v
}
Number.prototype.greaterThan = function (v) {
  return this.valueOf() > v
}
Number.prototype.greaterThanOrEqual = function (v) {
  return this.valueOf() >= v
}
Number.prototype.lessThan = function (v) {
  return this.valueOf() < v
}
Number.prototype.lessThanOrEqual = function (v) {
  return this.valueOf() <= v
}
Number.prototype.isNaN = function () {
  return isNaN(this.valueOf())
}
Number.prototype.isFinite = function () {
  return isFinite(this.valueOf())
}
Number.prototype.max = function (v) {
  return Math.max(this.valueOf(), v)
}
Number.prototype.min = function (v) {
  return Math.min(this.valueOf(), v)
}
Number.prototype.minus = function () {
  return -this.valueOf()
}
Number.prototype.absolute = function () {
  return +this.valueOf()
}
