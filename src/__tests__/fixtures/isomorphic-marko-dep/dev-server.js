// In dev we'll start a Vite dev server in middleware mode,
// and forward requests to our http request handler.

const { createServer } = require("vite");
const { join } = require("path");
const markoPlugin = require("../../..").default;

module.exports = (async () => {
  const devServer = await createServer({
    root: __dirname,
    appType: "custom",
    logLevel: "info",
    plugins: [markoPlugin()],
    optimizeDeps: { force: true },
    server: { middlewareMode: true },
  });
  return devServer.middlewares.use(async (req, res, next) => {
    try {
      const { handler } = await devServer.ssrLoadModule(
        join(__dirname, "./src/index.js")
      );
      await handler(req, res, next);
    } catch (err) {
      devServer.ssrFixStacktrace(err);
      return next(err);
    }
  });
})();
