// In production, simply start up the http server.
const { createServer } = require("http");
const serve = require("serve-handler");
const { handler } = require("./dist");
module.exports = createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;
  await serve(req, res, { public: "dist" });
});
