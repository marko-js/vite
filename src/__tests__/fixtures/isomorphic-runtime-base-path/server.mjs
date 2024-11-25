// In production, simply start up the http server.
import { createServer } from "http";
import path from 'path'
import serve from "serve-handler";
import url from 'url';

globalThis.assetsPath = "/my-prefix/";
// dyanmic import so globalThis.assetsPath can be set prior to the imported code executing
const { handler } = await import("./dist/index.mjs"); 

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const serveOpts = { public: path.resolve(__dirname, "dist") };

export default createServer(async (req, res) => {
  await handler(req, res);
  if (res.headersSent) return;
  if (req.url.startsWith("/my-prefix/")) {
    req.url = req.url.replace("/my-prefix", "/assets");
  }
  await serve(req, res, serveOpts);
});
