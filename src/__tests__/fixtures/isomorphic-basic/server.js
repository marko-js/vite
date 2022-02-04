// In production, simply start up the http server.
import { createServer } from "http";
import serve from "serve-handler";
import { handler } from "./dist/index.js";
createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;
  await serve(req, res, { public: "dist" });
}).listen(process.env.PORT || 3000);
