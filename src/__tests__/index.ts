import fs from "fs";
import path from "path";
import * as vite from "vite";
import { toMatchFile } from "jest-file-snapshot";
import type { RollupOutput } from "rollup";

const FIXTURES = path.join(__dirname, "fixtures");

expect.extend({ toMatchFile });

fs.readdirSync(FIXTURES).forEach((fixture) => {
  test(`${fixture}`, async () => {
    try {
      await fs.promises.rmdir(path.join(__dirname, "../../node_modules/.vite"), {
        recursive: true
      });
      // eslint-disable-next-line no-empty
    } catch (_) {}

    const dir = path.join(FIXTURES, fixture);
    const { serverEntry, targets, config } = (await import(
      path.join(dir, "config.ts")
    )) as {
      serverEntry?: string;
      targets: ("browser" | "server")[];
      config: vite.UserConfig;
    };

    for (const target of targets) {
      const snapshotDir = path.join(dir, "__snapshots__", target);
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



      (bundle as RollupOutput).output.forEach((chunk) => {
        expect(
          (chunk.type === "chunk" ? chunk.code : chunk.source)
            .toString()
            .replace(/@marko\/rollup\$\d\.\d\.\d/g, "@marko/rollup$latest")
        ).toMatchFile(path.join(snapshotDir, chunk.fileName));
      });
    }
  });
});
