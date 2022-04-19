// In production, simply start up the http server.
const path = require("path");
const { createServer } = require("http");
const serve = require("serve-handler");
const { handler } = require("./dist");
const serveOpts = { public: path.resolve(__dirname, "dist") };
module.exports = createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;
  await serve(req, res, serveOpts);
});
