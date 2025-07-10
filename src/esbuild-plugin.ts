import * as compiler from "@marko/compiler";
import fs from "fs";
import path from "path";
import type * as vite from "vite";

type ESBuildOptions = Exclude<
  vite.DepOptimizationConfig["esbuildOptions"],
  undefined
>;
type ESBuildPlugin = Exclude<ESBuildOptions["plugins"], undefined>[number];

const importTagReg = /<([^>]+)>/;
const markoErrorRegExp = /^(.+?)(?:\((\d+)(?:\s*,\s*(\d+))?\))?: (.*)$/gm;

export default function esbuildPlugin(config: compiler.Config): ESBuildPlugin {
  return {
    name: "marko",
    async setup(build) {
      const { platform = "browser" } = build.initialOptions;
      const isScan = build.initialOptions.plugins?.some(
        (v) => v.name === "vite:dep-scan",
      );
      const finalConfig: compiler.Config = {
        ...config,
        output: platform === "browser" ? "dom" : "html",
      };

      const scanConfig: compiler.Config = {
        ...finalConfig,
        output: "hydrate",
      };

      build.onResolve({ filter: /\.marko\./ }, (args) => {
        return {
          path: path.resolve(args.resolveDir, args.path),
          external: true,
        };
      });

      build.onResolve({ filter: importTagReg }, (args) => {
        const tagName = importTagReg.exec(args.path)?.[1];
        if (tagName) {
          const tagDef = compiler.taglib
            .buildLookup(args.resolveDir)
            .getTag(tagName);
          const tagFile = tagDef && (tagDef.template || tagDef.renderer);
          if (tagFile) {
            return { path: tagFile };
          }
        }
      });

      build.onLoad({ filter: /\.marko$/ }, async (args) => {
        try {
          const { code, meta } = await compiler.compileFile(
            args.path,
            isScan && args.namespace === "" ? scanConfig : finalConfig,
          );

          return {
            loader: "js",
            contents: code,
            watchFiles: meta.watchFiles,
            resolveDir: path.dirname(args.path),
          };
        } catch (e) {
          const text = (e as Error).message;
          const errors: any[] = [];
          let match: RegExpExecArray | null;
          let lines: string[] | undefined;

          while ((match = markoErrorRegExp.exec(text))) {
            const [, file, rawLine, rawCol, text] = match;
            const line = parseInt(rawLine, 10) || 1;
            const column = parseInt(rawCol, 10) || 1;
            lines ||= (await fs.promises.readFile(args.path, "utf-8")).split(
              /\n/g,
            );
            errors.push({
              text,
              location: {
                file,
                line,
                column,
                lineText: ` ${lines[line - 1]}`,
              },
            });
          }

          if (!errors.length) {
            errors.push({ text });
          }

          return {
            errors,
          };
        }
      });
    },
  };
}
