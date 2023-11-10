import path from "path";
import { build } from "esbuild";
const srcdir = path.resolve("src");
const outdir = path.resolve("dist");
await build({
  outdir,
  entryPoints: [path.join(srcdir, "index.ts")],
  outbase: srcdir,
  platform: "node",
  target: ["node18"],
  format: "esm",
  bundle: true,
  splitting: true,
  outExtension: { ".js": ".mjs" },
  plugins: [
    {
      name: "external-modules",
      setup(build) {
        build.onResolve(
          { filter: /^[^./]|^\.[^./]|^\.\.[^/]/ },
          ({ path }) => ({
            path,
            external: true,
          })
        );
      },
    },
  ],
});
