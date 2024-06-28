import { createServer, IncomingMessage, Server, ServerResponse } from "http"
import { AjaxTimeoutError } from "../../src/ajax/error.js"
import { Duration, Fs, IFunction2 } from "../../src/index.js"

describe("ajax", () => {
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

    const r = await Fs.ajax.post("http://localhost:3000", {}).lastOne()
    expect(r.getData()).toEqual({ test: true })
    expect(r.getStatus()).toEqual(200)
    expect(r.getHeaders()["content-type"]).toEqual("application/json")

    const r2 = await Fs.ajax
      .post("http://localhost:3000", {}, { responseType: "text" })
      .map((e) => e.getData())
      .lastOne()
    expect(r2).toEqual('{"test":true}')
  })

  it("2", async () => {
    jest.useFakeTimers()
    await serve(async (req, res) => {
      await new Promise((r) => setTimeout(r, Duration.millisecond(3000)))
      res.writeHead(200, "Ok", { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: 123 }))
    })

    const r = Fs.ajax.get("http://localhost:3000", { timeout: Duration.millisecond(30) }).lastOne()
    jest.advanceTimersByTimeAsync(31)
    await expect(r).rejects.toThrow(AjaxTimeoutError)
    jest.clearAllTimers()
  })
})
