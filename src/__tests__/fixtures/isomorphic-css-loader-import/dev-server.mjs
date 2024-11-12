// In dev we'll start a Vite dev server in middleware mode,
// and forward requests to our http request handler.

import { createServer } from "vite";
import path from "path";
import url from "url";
import { createRequire } from "module";

// change to import once marko-vite is updated to ESM
const markoPlugin = createRequire(import.meta.url)("../../..").default;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const devServer = await createServer({
  root: __dirname,
  appType: "custom",
  logLevel: "silent",
  plugins: [markoPlugin()],
  optimizeDeps: { force: true },
  server: {
    middlewareMode: true,
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/__snapshots__/**"],
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
});

export default devServer.middlewares.use(async (req, res, next) => {
  try {
    const { handler } = await devServer.ssrLoadModule(
      path.join(__dirname, "./src/index.js"),
    );
    await handler(req, res, next);
  } catch (err) {
    // devServer.ssrFixStacktrace(err);
    return next(err);
  }
});
