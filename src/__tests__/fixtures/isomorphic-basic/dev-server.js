// In dev we'll start a Vite dev server in middleware mode,
// and forward requests to our http request handler.

import { createServer } from "vite";

const devServer = await createServer({
  server: {
    force: true,
    middlewareMode: "ssr",
  },
});
devServer.middlewares
  .use(async (req, res, next) => {
    try {
      const { handler } = await devServer.ssrLoadModule("./src/index.js");
      await handler(req, res, next);
    } catch (err) {
      devServer.ssrFixStacktrace(err);
      return next(err);
    }
  })
  .listen(process.env.PORT || 3000);
