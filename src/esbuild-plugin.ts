import fs from "fs";
import path from "path";
import type * as esbuild from "esbuild";
import type * as Compiler from "@marko/compiler";

const markoErrorRegExp = /^(.+?)(?:\((\d+)(?:\s*,\s*(\d+))?\))?: (.*)$/gm;

export default function esbuildPlugin(
  compiler: typeof Compiler,
  config: Compiler.Config
): esbuild.Plugin {
  return {
    name: "marko",
    async setup(build) {
      const { platform = "browser" } = build.initialOptions;
      const virtualFiles = new Map<string, { code: string; map?: unknown }>();
      const finalConfig: Compiler.Config = {
        ...config,
        output: platform === "browser" ? "dom" : "html",
        resolveVirtualDependency(from, dep) {
          virtualFiles.set(path.join(from, "..", dep.virtualPath), dep);
          return dep.virtualPath;
        },
      };

      if (platform === "browser") {
        build.onResolve({ filter: /\.marko\./ }, (args) => {
          return {
            namespace: "marko:virtual",
            path: path.resolve(args.resolveDir, args.path),
          };
        });

        build.onLoad(
          { filter: /\.marko\./, namespace: "marko:virtual" },
          (args) => ({
            contents: virtualFiles.get(args.path)!.code,
            loader: path.extname(args.path).slice(1) as esbuild.Loader,
          })
        );

        build.onResolve({ filter: /\.marko$/ }, async (args) => ({
          namespace: "file",
          path: path.resolve(args.resolveDir, args.path),
        }));
      }

      build.onLoad({ filter: /\.marko$/, namespace: "file" }, async (args) => {
        try {
          const { code, meta } = await compiler.compileFile(
            args.path,
            finalConfig
          );

          return {
            loader: "js",
            contents: code,
            watchFiles: meta.watchFiles,
            resolveDir: path.dirname(args.path),
          };
        } catch (e) {
          const text = (e as Error).message;
          const errors: esbuild.PartialMessage[] = [];
          let match: RegExpExecArray | null;
          let lines: string[] | undefined;

          while ((match = markoErrorRegExp.exec(text))) {
            const [, file, rawLine, rawCol, text] = match;
            const line = parseInt(rawLine, 10) || 1;
            const column = parseInt(rawCol, 10) || 1;
            lines ||= (await fs.promises.readFile(args.path, "utf-8")).split(
              /\n/g
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
