// In production, simply start up the http server.
import path from "path";
import url from "url";
import { createServer } from "http";
import serve from "serve-handler";
import { handler } from "./dist/index.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const serveOpts = { public: path.resolve(__dirname, "dist") };

export default createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;
  await serve(req, res, serveOpts);
});
