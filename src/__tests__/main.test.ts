import fs from "fs";
import path from "path";
import * as vite from "vite";
import snap from "mocha-snap";
import type { RollupOutput } from "rollup";

const FIXTURES = path.join(__dirname, "fixtures");

fs.readdirSync(FIXTURES).forEach((fixture) => {
  it(fixture, async () => {
    await fs.promises.rm(path.join(__dirname, "../../node_modules/.vite"), {
      recursive: true,
      force: true,
    });

    const dir = path.join(FIXTURES, fixture);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { serverEntry, targets, config } = require(path.join(
      dir,
      "config.ts"
    )) as {
      serverEntry?: string;
      targets: ("browser" | "server")[];
      config: vite.UserConfig;
    };

    for (const target of targets) {
      const isServer = target === "server";
      const bundle = await vite.build({
        ...config,
        root: dir,
        logLevel: "silent",
        build: {
          ...config.build,
          rollupOptions: isServer
            ? {
                input: path.join(dir, serverEntry!),
              }
            : {},
          outDir: path.join(dir, "dist", target),
          ssr: isServer,
          minify: false,
          write: targets.length === 2,
        },
      });

      if (Array.isArray(bundle)) {
        throw new Error("Unexpected array build");
      }

      for (const chunk of (bundle as RollupOutput).output) {
        const source = (chunk.type === "chunk" ? chunk.code : chunk.source)
          .toString()
          .replace(/@marko\/vite\$\d\.\d\.\d/g, "@marko/vite$latest");
        console.log(chunk.fileName);
        await snap(source, { name: chunk.fileName });
      }
    }
  });
});
