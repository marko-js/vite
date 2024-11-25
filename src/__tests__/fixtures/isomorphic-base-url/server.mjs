// In production, simply start up the http server.
import { createServer } from "http";
import path from "path";
import serve from "serve-handler";
import url from "url";

import { handler } from "./dist/index.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const serveOpts = { public: path.resolve(__dirname, "dist") };
const baseUrl = process.env.BASE_URL;

export default createServer(async (req, res) => {
  // remove the base url from the request url
  if (req.url.startsWith(baseUrl, 1)) {
    req.url = req.url.slice(baseUrl.length);
  }

  await handler(req, res);
  if (res.headersSent) return;
  await serve(req, res, serveOpts);
});
