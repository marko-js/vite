import { createRequire } from "module";
import path from "path";
import url from "url";
import { createServer } from "vite";

const markoPlugin = createRequire(import.meta.url)("../../..").default;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const devServer = await createServer({
  root: __dirname,
  appType: "custom",
  logLevel: "warn",
  plugins: [
    markoPlugin({ translator: "marko/translator", runtimeId: "M_20a04ad2" }),
  ],
  optimizeDeps: { force: true },
  server: {
    ws: false,
    hmr: false,
    middlewareMode: true,
    watch: {
      ignored: ["**/node_modules/**", "**/dist/**", "**/__snapshots__/**"],
    },
  },
  build: { assetsInlineLimit: 0 },
});

export default devServer.middlewares.use(async (req, res, next) => {
  try {
    const { handler } = await devServer.ssrLoadModule(
      path.join(__dirname, "./src/index.js"),
    );
    await handler(req, res, next);
  } catch (err) {
    devServer.ssrFixStacktrace(err);
    return next(err);
  }
});
