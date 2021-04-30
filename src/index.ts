import os from "os";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as vite from "vite";
import type * as Compiler from "@marko/compiler";
import getServerEntryTemplate from "./server-entry-template";
import {
  generateInputDoc,
  generateDocManifest,
  DocManifest,
} from "./manifest-generator";

export interface Options {
  // Defaults to true, set to false to disable automatic component discovery and hydration.
  linked?: boolean;
  // Override the Marko compiler instance being used. (primarily for tools wrapping this module)
  compiler?: string;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: Compiler.Config["babelConfig"];
}

interface BrowserManifest {
  [id: string]: DocManifest;
}

interface ServerManifest {
  entries: {
    [entryId: string]: string;
  };
  chunksNeedingAssets: string[];
}

const virtualFiles = new Map<string, { code: string; map?: any }>();
const defaultCompiler = require.resolve("@marko/compiler");
const queryReg = /\?marko-.+$/;
const browserEntryQuery = "?marko-browser-entry";
const serverEntryQuery = "?marko-server-entry";
const virtualFileQuery = "?marko-virtual";
const markoExt = ".marko";
const htmlExt = ".html";
const resolveOpts = { skipSelf: true };
let tempDir: Promise<string> | undefined;

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const compiler = require(opts.compiler || defaultCompiler) as typeof Compiler;
  const { runtimeId, linked = true } = opts;

  const baseConfig: Compiler.Config = {
    runtimeId,
    sourceMaps: true,
    writeVersionComment: false,
    cache: new Map<string, Compiler.CompileResult>(),
    babelConfig: {
      ...opts.babelConfig,
      caller: {
        name: "@marko/vite",
        supportsStaticESM: true,
        supportsDynamicImport: true,
        supportsTopLevelAwait: true,
        supportsExportNamespaceFrom: true,
        ...opts.babelConfig?.caller,
      },
    },
  };

  const ssrConfig: Compiler.Config = {
    ...baseConfig,
    output: "html",
  };

  const domConfig: Compiler.Config = {
    ...baseConfig,
    resolveVirtualDependency(from, dep) {
      const query = `${virtualFileQuery}&id=${dep.virtualPath}`;
      const id = from + query;

      if (devServer) {
        const prev = virtualFiles.get(id);
        if (prev && prev.code !== dep.code) {
          devServer.moduleGraph.invalidateModule(
            devServer.moduleGraph.getModuleById(id)!
          );
        }
      }

      virtualFiles.set(id, dep);
      return `./${path.basename(from) + query}`;
    },
    output: "dom",
  };

  const hydrateConfig: Compiler.Config = {
    ...domConfig,
    output: "hydrate",
  };

  let root: string;
  let isBuild = false;
  let isSSRBuild = false;
  let devServer: vite.ViteDevServer;
  let registeredTag: string | false = false;
  let serverManifest: ServerManifest | undefined;
  const transformWatchDeps = new Map<string, string[]>();

  return [
    {
      name: "marko-vite:pre",
      enforce: "pre", // Must be pre to allow us to resolve assets before vite.
      config(config, env) {
        root = config.root || process.cwd();
        isBuild = env.command === "build";
        isSSRBuild = isBuild && linked && Boolean(config.build!.ssr);

        if (!registeredTag) {
          // Here we inject either the watchMode vite tag, or the build one.
          registeredTag = path.resolve(
            __dirname.slice(0, __dirname.lastIndexOf("vite") + 4),
            "components",
            isBuild ? "vite.marko" : "vite-watch.marko"
          );

          compiler.taglib.register("@marko/vite", {
            "<_vite>": {
              template: registeredTag,
            },
            "<head>": {
              transformer: require.resolve("./render-assets-transform"),
            },
            "<body>": {
              transformer: require.resolve("./render-assets-transform"),
            },
          });
        }

        if (!isBuild) {
          config.optimizeDeps ??= {};
          config.optimizeDeps.include ??= [];
          config.optimizeDeps.include.push(
            ...new Set([
              ...compiler.getRuntimeEntryFiles("html", opts.translator),
              ...compiler.getRuntimeEntryFiles("dom", opts.translator),
            ])
          );
        }
      },
      configureServer(_server) {
        ssrConfig.hot = domConfig.hot = true;
        devServer = _server;
      },
      handleHotUpdate(ctx) {
        const invalidatedModules: vite.ModuleNode[] = [];
        for (const [id, watchFiles] of transformWatchDeps) {
          if (watchFiles.includes(ctx.file)) {
            const mod = devServer.moduleGraph.getModuleById(id);
            if (mod) {
              invalidatedModules.push(mod);
            }
          }
        }

        if (invalidatedModules.length) {
          return ctx.modules.concat(invalidatedModules);
        }
      },
      async buildStart(inputOptions) {
        if (isBuild && linked && !isSSRBuild) {
          const serverMetaFile = await getServerManifestFile(root);
          this.addWatchFile(serverMetaFile);

          try {
            serverManifest = JSON.parse(
              await fs.promises.readFile(serverMetaFile, "utf-8")
            ) as ServerManifest;
            inputOptions.input = toHTMLEntries(root, serverManifest.entries);
          } catch (err) {
            this.error(
              `You must run the "ssr" build before the "browser" build.`
            );
          }

          if (isEmpty(inputOptions.input)) {
            this.error("No Marko files were found when compiling the server.");
          }
        }
      },
      async resolveId(importee, importer, _importOpts, ssr) {
        const importeeIsAbsolute = path.isAbsolute(importee);
        if (!importeeIsAbsolute || importee.startsWith(root)) {
          let importeeQuery = getMarkoQuery(importee);

          if (importeeQuery) {
            importee = importee.slice(0, -importeeQuery.length);
          } else if (
            ssr &&
            linked &&
            importer &&
            isMarkoFile(importee) &&
            !isMarkoFile(importer.replace(queryReg, ""))
          ) {
            importeeQuery = serverEntryQuery;
          } else if (virtualFiles.has(importee)) {
            return importee;
          }

          if (importeeQuery) {
            const resolved = importeeIsAbsolute
              ? { id: importee }
              : importee[0] === "."
              ? {
                  id: importer
                    ? path.resolve(importer, "..", importee)
                    : path.resolve(root, importee),
                }
              : await this.resolve(importee, importer, resolveOpts);

            if (resolved) {
              resolved.id += importeeQuery;
            }

            return resolved;
          }
        }

        return null;
      },
      async load(id) {
        switch (getMarkoQuery(id)) {
          case serverEntryQuery: {
            const fileName = id.slice(0, -serverEntryQuery.length);
            let entryData: string;

            if (isBuild) {
              const relativeFileName = path.relative(root, fileName);
              const entryId = toEntryId(relativeFileName);
              serverManifest ??= {
                entries: {},
                chunksNeedingAssets: [],
              };
              serverManifest.entries[entryId] = relativeFileName;
              entryData = JSON.stringify(entryId);
            } else {
              entryData = JSON.stringify(
                await generateDocManifest(
                  await devServer.transformIndexHtml(
                    "/",
                    generateInputDoc(
                      path.relative(root, fileName) + browserEntryQuery
                    )
                  )
                )
              );
            }

            return getServerEntryTemplate({
              fileName,
              entryData,
              runtimeId,
            });
          }
          case browserEntryQuery:
            return fs.promises.readFile(
              id.slice(0, -browserEntryQuery.length),
              "utf-8"
            );
          default:
            if (!id.startsWith(root)) {
              id = path.join(root, id);
            }

            return virtualFiles.get(id) || null;
        }
      },
      async transform(source, id, ssr) {
        const originalId = id;
        const query = getMarkoQuery(id);

        if (query && !query.startsWith(virtualFileQuery)) {
          id = id.slice(0, -query.length);
        }

        if (!isMarkoFile(id)) {
          return null;
        }

        const compiled = await compiler.compile(
          source,
          id,
          ssr
            ? ssrConfig
            : query === browserEntryQuery
            ? hydrateConfig
            : domConfig
        );

        const { map, meta } = compiled;
        let { code } = compiled;

        if (query !== browserEntryQuery && devServer) {
          code += `\nif (import.meta.hot) import.meta.hot.accept();`;
        }

        for (const watchFile of meta.watchFiles!) {
          this.addWatchFile(watchFile);
        }

        transformWatchDeps.set(originalId, meta.watchFiles!);

        return { code, map };
      },
    },
    {
      name: "marko-vite:post",
      apply: "build",
      enforce: "post", // We use a "post" plugin to allow us to read the final generated `.html` from vite.
      async generateBundle(outputOptions, bundle, isWrite) {
        if (!linked) {
          return;
        }

        if (!isWrite) {
          this.error(
            `Linked builds are currently only supported when in "write" mode.`
          );
        }

        if (!serverManifest) {
          this.error(
            "No Marko files were found when bundling the server in linked mode."
          );
        }

        if (isSSRBuild) {
          const dir = outputOptions.dir
            ? path.resolve(outputOptions.dir)
            : path.resolve(outputOptions.file!, "..");

          for (const fileName in bundle) {
            const chunk = bundle[fileName];

            if (chunk.type === "chunk") {
              for (const id in chunk.modules) {
                if (id === registeredTag) {
                  serverManifest!.chunksNeedingAssets.push(
                    path.resolve(dir, fileName)
                  );
                  break;
                }
              }
            }
          }

          await fs.promises.writeFile(
            await getServerManifestFile(root),
            JSON.stringify(serverManifest)
          );
        } else {
          const browserManifest: BrowserManifest = {};

          for (const entryId in serverManifest.entries) {
            const fileName = serverManifest.entries[entryId];
            const chunkId = fileName + htmlExt;
            const chunk = bundle[chunkId];

            if (chunk?.type === "asset") {
              browserManifest[entryId] = await generateDocManifest(
                chunk.source.toString()
              );

              delete bundle[chunkId];
            } else {
              this.error(
                `Marko template had unexpected output from vite, ${fileName}`
              );
            }
          }

          const manifestStr = `;var __MARKO_MANIFEST__=${JSON.stringify(
            browserManifest
          )};\n`;

          for (const fileName of serverManifest.chunksNeedingAssets) {
            await fs.promises.appendFile(fileName, manifestStr);
          }
        }
      },
    },
  ];
}

function getMarkoQuery(id: string) {
  return queryReg.exec(id)?.[0] || "";
}

function isMarkoFile(id: string) {
  return id.endsWith(markoExt);
}

function toHTMLEntries(root: string, serverEntries: ServerManifest["entries"]) {
  const result: string[] = [];

  for (const id in serverEntries) {
    const markoFile = path.join(root, serverEntries[id]);
    const htmlFile = markoFile + htmlExt;
    virtualFiles.set(htmlFile, {
      code: generateInputDoc(markoFile + browserEntryQuery),
    });
    result.push(htmlFile);
  }

  return result;
}

async function getServerManifestFile(root: string) {
  return path.join(await getTempDir(root), "manifest.json");
}

function getTempDir(root: string) {
  return (
    tempDir ||
    (tempDir = (async () => {
      const dir = path.join(
        os.tmpdir(),
        `marko-vite-${crypto.createHash("SHA1").update(root).digest("hex")}`
      );

      try {
        const stat = await fs.promises.stat(dir);

        if (stat.isDirectory()) {
          return dir;
        }
      } catch {
        await fs.promises.mkdir(dir);
        return dir;
      }

      throw new Error("Unable to create temp directory");
    })())
  );
}

function toEntryId(id: string) {
  const lastSepIndex = id.lastIndexOf(path.sep);
  let name = id.slice(lastSepIndex + 1, id.indexOf(".", lastSepIndex));

  if (name === "index" || name === "template") {
    name = id.slice(
      id.lastIndexOf(path.sep, lastSepIndex - 1) + 1,
      lastSepIndex
    );
  }

  return `${name}_${crypto
    .createHash("SHA1")
    .update(id)
    .digest("base64")
    .replace(/[/+]/g, "-")
    .slice(0, 4)}`;
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}
