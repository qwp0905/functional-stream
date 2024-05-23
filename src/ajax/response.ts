export class AjaxResponse<T> {
  constructor(private readonly xhr: XMLHttpRequest) {}

  getData(): T {
    return this.xhr.response
  }

  getStatus() {
    return this.xhr.status
  }
}
