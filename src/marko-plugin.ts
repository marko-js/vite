import fs from "fs";
import path from "path";
import type * as esbuild from "esbuild";
import type * as Compiler from "@marko/compiler";

const cache = new Map<string, Compiler.CompileResult>();
const markoErrorRegExp = /^(.+?)(?:\((\d+)(?:\s*,\s*(\d+))?\))?: (.*)$/gm;

export interface Options {
  // Override the Marko compiler instance being used. (primarily for tools wrapping this module)
  compiler?: string;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: Compiler.Config["babelConfig"];
}

export default function esbuildPlugin(opts: Options = {}): esbuild.Plugin {
  let compiler: typeof Compiler;
  const { runtimeId, translator } = opts;
  const babelConfig = {
    ...opts.babelConfig,
    caller: {
      name: "@marko/esbuild",
      supportsStaticESM: true,
      supportsDynamicImport: true,
      supportsTopLevelAwait: true,
      supportsExportNamespaceFrom: true,
      ...opts.babelConfig?.caller,
    },
  };

  return {
    name: "marko",
    async setup(build) {
      const { platform = "browser", sourcemap } = build.initialOptions;
      const output = platform === "browser" ? "dom" : "html";
      let resolveVirtualDependency: Compiler.Config["resolveVirtualDependency"];
      compiler ??= await import(opts.compiler || "@marko/compiler");

      if (platform === "browser") {
        const virtualFiles = new Map<string, { code: string; map?: unknown }>();
        resolveVirtualDependency = (from, dep) => {
          virtualFiles.set(path.join(from, "..", dep.virtualPath), dep);
          return dep.virtualPath;
        };

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
          namespace: args.kind === "entry-point" ? "marko:hydrate" : "file",
          path: path.resolve(args.resolveDir, args.path),
        }));

        build.onLoad(
          { filter: /\.marko$/, namespace: "marko:hydrate" },
          (args) => compileSafe(args.path, "hydrate")
        );
      }

      build.onLoad({ filter: /\.marko$/, namespace: "file" }, (args) =>
        compileSafe(args.path, output)
      );

      async function compileSafe(
        filename: string,
        output: Exclude<Compiler.Config["output"], void>
      ): Promise<esbuild.OnLoadResult> {
        try {
          const { code, meta } = await compiler.compileFile(filename, {
            cache,
            output,
            runtimeId,
            translator,
            babelConfig,
            resolveVirtualDependency,
            writeVersionComment: false,
            sourceMaps: output === "hydrate" || !sourcemap ? false : "inline",
          });

          return {
            loader: "js",
            contents: code,
            watchFiles: meta.watchFiles,
            resolveDir: path.dirname(filename),
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
            lines ||= (await fs.promises.readFile(filename, "utf-8")).split(
              /\r\n|\r|\n/g
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
      }
    },
  };
}
