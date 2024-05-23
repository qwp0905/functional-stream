export class AjaxResponse<T> {
  constructor(private readonly xhr: XMLHttpRequest) {}

  get data(): T {
    return this.xhr.response
  }
}
