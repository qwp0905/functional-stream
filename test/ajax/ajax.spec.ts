import { createServer, IncomingMessage, Server, ServerResponse } from "http"
import { AjaxError, AjaxTimeoutError, BodyTypeNotSupportError } from "../../src/ajax/index.js"
import { Duration, Fs, IFunction2 } from "../../src/index.js"

describe("ajax", () => {
  const host: string = "http://localhost:3000"

  const handler: jest.Mock<
    any,
    [IncomingMessage, ServerResponse<IncomingMessage> & { req: IncomingMessage }]
  > = jest.fn()
  let server: Server
  const serve = (
    callback: IFunction2<
      IncomingMessage,
      ServerResponse<IncomingMessage> & { req: IncomingMessage },
      any
    >
  ) => {
    handler.mockImplementation(callback)
    return new Promise<void>((r) => (server = createServer(handler).listen(3000, "localhost", r)))
  }

  afterEach(() => {
    server?.close()
    handler.mockClear()
  })

  it("1", async () => {
    await serve(async (req, res) => {
      const body: any = await new Promise((resolve) => {
        let tmp = ""
        req.on("data", (chunk) => (tmp += chunk))
        req.on("end", () => resolve(JSON.parse(tmp)))
      })

      res.statusCode = 200
      res.setHeader("Content-Type", "application/json")
      res.end(JSON.stringify({ ...body, test: true }))
    })

    const r = await Fs.ajax.post(host, {}).lastOne()
    expect(r.getData()).toEqual({ test: true })
    expect(r.getStatus()).toEqual(200)
    expect(r.getHeaders()["content-type"]).toEqual("application/json")

    const r2 = await Fs.ajax
      .post(host, {}, { responseType: "text" })
      .map((e) => e.getData())
      .lastOne()
    expect(r2).toEqual('{"test":true}')

    const r3 = await Fs.ajax
      .post(host, {}, { responseType: "stream" })
      .map((e) => e.getData())
      .mergeAll()
      .mergeAll()
      .toArray()
    expect(r3).toEqual(["{", '"', "t", "e", "s", "t", '"', ":", "t", "r", "u", "e", "}"])

    const r4 = Fs.ajax
      .post(host, Symbol())
      .map((e) => e.getData())
      .lastOne()
    await expect(r4).rejects.toThrow(BodyTypeNotSupportError)

    const r5 = await Fs.ajax
      .post(host, {}, { responseType: "json" })
      .map((e) => e.getData())
      .lastOne()
    expect(r5).toEqual({ test: true })
  })

  it("2", async () => {
    jest.useFakeTimers()
    await serve(async (_, res) => {
      await new Promise((r) => setTimeout(r, Duration.millisecond(3000)))
      res.writeHead(200, "Ok", { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: 123 }))
    })

    const r = Fs.ajax.get(host, { timeout: Duration.millisecond(30) }).lastOne()
    jest.advanceTimersByTimeAsync(31)
    await expect(r).rejects.toThrow(AjaxTimeoutError)
    jest.clearAllTimers()
  })

  it("3", async () => {
    await serve(async (req, res) => {
      const body: string = await new Promise((resolve) => {
        let tmp = ""
        req.on("data", (chunk) => (tmp += chunk))
        req.on("end", () => resolve(tmp))
      })

      res.writeHead(200)
      res.end(body)
    })

    const r1 = await Fs.ajax
      .get(host)
      .map((e) => e.getData())
      .lastOne()
    expect(r1).toEqual("")

    const r2 = await Fs.ajax
      .post(host, "123123123")
      .map((e) => e.getData())
      .lastOne()
    expect(r2).toEqual("123123123")

    const b3 = new URLSearchParams({ test: "123" })
    const r3 = await Fs.ajax
      .post(host, b3)
      .map((e) => e.getData())
      .lastOne()
    expect(r3).toEqual(b3.toString())

    const b4 = new ArrayBuffer(5)
    const ar = new Uint8Array(b4)
    Buffer.from("skdjf").forEach((e, i) => (ar[i] = e))
    const r4 = await Fs.ajax
      .post(host, b4)
      .map((e) => e.getData())
      .lastOne()
    expect(r4).toEqual("skdjf")

    const b5 = new FormData()
    b5.append("test", "test")
    b5.append("test1", "test1")
    const r5 = await Fs.ajax
      .post(host, b5)
      .map((e) => e.getData())
      .lastOne()

    expect(r5).toMatch(
      /^------formdata-undici-\d{12}\r\nContent-Disposition: form-data; name=\"test\"\r\n\r\ntest\r\n------formdata-undici-\d{12}\r\nContent-Disposition: form-data; name=\"test1\"\r\n\r\ntest1\r\n------formdata-undici-\d{12}--$/
    )

    const r6 = await Fs.ajax
      .put(host, ar)
      .map((e) => e.getData())
      .lastOne()
    expect(r6).toEqual("skdjf")

    const r7 = await Fs.ajax
      .post(
        host,
        new ReadableStream({
          start(c) {
            c.enqueue("testest")
            c.close()
          }
        })
      )
      .map((e) => e.getData())
      .lastOne()
    expect(r7).toEqual("testest")

    const r8 = Fs.ajax
      .get(host, { validate: (code) => code !== 200 })
      .map((e) => e.getData())
      .lastOne()
    await expect(r8).rejects.toThrow(AjaxError)

    const r9 = Fs.ajax.patch(host).lastOne()
    await expect(r9).rejects.toThrow(AjaxError)
  })

  it("3", async () => {
    await serve(async (req, res) => {
      res.writeHead(200)
      res.end(req.url)
    })

    const r1 = await Fs.ajax
      .delete(host, { params: { test: "test" } })
      .map((e) => e.getData())
      .lastOne()
    expect(r1).toEqual("/?test=test")

    const r2 = await Fs.ajax
      .delete("http://localhost:3000?abc=123", { params: { test: "test" } })
      .map((e) => e.getData())
      .lastOne()
    expect(r2).toEqual("/?abc=123&test=test")
  })

  it("4", async () => {
    await serve(async (req, res) => {
      res.writeHead(200)
      res.end(req.headers.authorization)
    })

    const user = "user"
    const password = "pass"
    const authorization = `Basic ${btoa(`${user}:${password}`)}`
    const r1 = await Fs.ajax
      .delete(host, { user, password })
      .map((e) => e.getData())
      .lastOne()
    expect(r1).toEqual(authorization)
  })

  it("5", async () => {
    await serve((_, res) => {
      res.writeHead(200, "Ok", { "content-type": "application/x-www-form-urlencode" })
      res.end("test=123")
    })

    const r1 = await Fs.ajax
      .get(host)
      .map((e) => e.getData())
      .lastOne()
    expect(r1).toEqual({ test: "123" })

    const r2 = await Fs.ajax.put<ArrayBuffer>(host, {}, { responseType: "arraybuffer" }).lastOne()
    expect(Buffer.from(r2.getData()).toString()).toEqual("test=123")
    expect(r2.getData() instanceof ArrayBuffer).toBeTruthy()

    const r3 = await Fs.ajax
      .head(host)
      .map((e) => e.getHeaders())
      .lastOne()
    expect(r3).toHaveProperty("content-type", "application/x-www-form-urlencode")
  })
})
