// In production, simply start up the http server.
globalThis.assetsPath = "/my-prefix/";

const path = require("path");
const { createServer } = require("http");
const serve = require("serve-handler");
const { handler } = require("./dist/index.mjs");
const serveOpts = { public: path.resolve(__dirname, "dist") };

module.exports = createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;

  if (req.url.startsWith("/my-prefix/")) {
    req.url = req.url.replace("/my-prefix", "");
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("Hello World");
    await serve(req, res, serveOpts);
  } else {
    res.statusCode = 404;
    res.end("Not Found");
  }
});
