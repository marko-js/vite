import type * as vite from "vite";
import type * as Compiler from "@marko/compiler";

import os from "os";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import anyMatch from "anymatch";
import { pathToFileURL, fileURLToPath } from "url";

import getServerEntryTemplate from "./server-entry-template";
import {
  generateInputDoc,
  generateDocManifest,
  DocManifest,
} from "./manifest-generator";
import esbuildPlugin from "./marko-plugin";

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

const normalizePath =
  path.sep === "\\"
    ? (id: string) => id.replace(/\\/g, "/")
    : (id: string) => id;
const virtualFiles = new Map<string, { code: string; map?: any }>();
const queryReg = /\?marko-.+$/;
const browserEntryQuery = "?marko-browser-entry";
const serverEntryQuery = "?marko-server-entry";
const virtualFileQuery = "?marko-virtual";
const markoExt = ".marko";
const htmlExt = ".html";
const resolveOpts = { skipSelf: true };
const thisFile =
  typeof __filename === "string" ? __filename : fileURLToPath(import.meta.url);
let tempDir: Promise<string> | undefined;

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  let compiler: typeof Compiler;
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
    resolveVirtualDependency(from, dep) {
      const query = `${virtualFileQuery}&id=${encodeURIComponent(
        dep.virtualPath
      )}`;
      const id = normalizePath(from) + query;

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
  };

  const ssrConfig: Compiler.Config = {
    ...baseConfig,
    output: "html",
  };

  const domConfig: Compiler.Config = {
    ...baseConfig,
    output: "dom",
  };

  const hydrateConfig: Compiler.Config = {
    ...domConfig,
    output: "hydrate",
  };

  let root: string;
  let devEntryFile: string;
  let isBuild = false;
  let isSSRBuild = false;
  let devServer: vite.ViteDevServer;
  let registeredTag: string | false = false;
  let serverManifest: ServerManifest | undefined;
  const transformWatchFiles = new Map<string, string[]>();
  const transformOptionalFiles = new Map<string, string[]>();

  return [
    {
      name: "marko-vite:pre",
      enforce: "pre", // Must be pre to allow us to resolve assets before vite.
      async config(config, env) {
        compiler ??= (await import(
          opts.compiler || "@marko/compiler"
        )) as typeof Compiler;
        root = normalizePath(config.root || process.cwd());
        devEntryFile = path.join(root, "index.html");
        isBuild = env.command === "build";
        isSSRBuild = isBuild && linked && Boolean(config.build!.ssr);

        if (!registeredTag) {
          // Here we inject either the watchMode vite tag, or the build one.
          const transformer = path.resolve(
            thisFile,
            "../render-assets-transform"
          );
          registeredTag = normalizePath(
            path.resolve(
              thisFile,
              "../components",
              isBuild ? "vite.marko" : "vite-watch.marko"
            )
          );
          compiler.taglib.register("@marko/vite", {
            "<_vite>": { template: registeredTag },
            "<head>": { transformer },
            "<body>": { transformer },
          });
        }

        const lookup = compiler.taglib.buildLookup(root) as any;
        const taglibDeps: string[] = [];

        for (const name in lookup.taglibsById) {
          const taglib = lookup.taglibsById[name];
          if (/[\\/]node_modules[\\/](?!@marko[\\/])/.test(taglib.dirname)) {
            for (const tagName in taglib.tags) {
              const tag = taglib.tags[tagName];
              const entry = tag.template || tag.renderer;

              if (entry) {
                taglibDeps.push(
                  entry.replace(/^.*?[\\/]node_modules[\\/]/, "")
                );
              }
            }
          }
        }
        const domDeps = Array.from(
          new Set(
            compiler
              .getRuntimeEntryFiles("dom", opts.translator)
              .concat(taglibDeps)
          )
        );

        const optimizeDeps = (config.optimizeDeps ??= {});
        optimizeDeps.include ??= [];
        optimizeDeps.include = optimizeDeps.include.concat(domDeps);

        if (!isBuild) {
          const serverDeps = Array.from(
            new Set(compiler.getRuntimeEntryFiles("html", opts.translator))
          );
          const ssr = ((config as any).ssr ??= {});
          ssr.external ??= [];
          ssr.external = ssr.external.concat(serverDeps);
        }
        return {
          ...config,
          optimizeDeps: {
            ...config.optimizeDeps,
            extensions: [...(config?.optimizeDeps?.extensions || []), ".marko"],
            esbuildOptions: {
              plugins: [esbuildPlugin()],
            } as any,
          },
        };
      },
      configureServer(_server) {
        ssrConfig.hot = domConfig.hot = true;
        devServer = _server;
        devServer.watcher.on("all", (type, filename) => {
          for (const [id, files] of transformWatchFiles) {
            if (anyMatch(files, filename)) {
              devServer.watcher.emit("change", id);
            }
          }

          if (type === "add" || type === "unlink") {
            let clearedCache = false;
            for (const [id, files] of transformOptionalFiles) {
              if (anyMatch(files, filename)) {
                if (!clearedCache) {
                  baseConfig.cache!.clear();
                  clearedCache = true;
                }
                devServer.watcher.emit("change", id);
              }
            }
          }
        });
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
      async resolveId(
        importee,
        importer,
        importOpts,
        ssr = (importOpts as any).ssr
      ) {
        if (virtualFiles.has(importee)) {
          return importee;
        }

        let importeeQuery = getMarkoQuery(importee);

        if (importeeQuery) {
          importee = importee.slice(0, -importeeQuery.length);
        } else if (
          ssr &&
          linked &&
          importer &&
          importer !== devEntryFile && // Vite tries to resolve against an `index.html` in some cases, we ignore it here.
          isMarkoFile(importee) &&
          !isMarkoFile(importer.replace(queryReg, ""))
        ) {
          importeeQuery = serverEntryQuery;
        } else if (
          !ssr &&
          isBuild &&
          importer &&
          isMarkoFile(importee) &&
          this.getModuleInfo(importer)?.isEntry
        ) {
          importeeQuery = browserEntryQuery;
        }

        if (importeeQuery) {
          const resolved =
            importee[0] === "."
              ? {
                  id: normalizePath(
                    importer
                      ? path.resolve(importer, "..", importee)
                      : path.resolve(root, importee)
                  ),
                }
              : await this.resolve(importee, importer, resolveOpts);

          if (resolved) {
            resolved.id += importeeQuery;
          }

          return resolved;
        }

        return null;
      },
      async load(id) {
        switch (getMarkoQuery(id)) {
          case serverEntryQuery: {
            const fileName = id.slice(0, -serverEntryQuery.length);
            let entryData: string;

            if (isBuild) {
              const relativeFileName = path.posix.relative(root, fileName);
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
                    generateInputDoc(fileNameToURL(fileName, root))
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
        }

        return virtualFiles.get(id) || null;
      },
      async transformIndexHtml(html) {
        if (isBuild) {
          return html;
        }

        return html.replace(
          /(src\s*=\s*(['"])(?:(?!\2).)*\.marko)(?:\?((?:(?!\2).)*))?\2/gim,
          (_, prefix, quote, query) =>
            prefix + browserEntryQuery + (query ? "&" + query : "") + quote
        );
      },
      async transform(source, id, ssr) {
        const query = getMarkoQuery(id);

        if (query && !query.startsWith(virtualFileQuery)) {
          id = id.slice(0, -query.length);

          if (query === serverEntryQuery) {
            id = `${id.slice(0, -markoExt.length)}.entry.marko`;
          }
        }

        if (!isMarkoFile(id)) {
          return null;
        }

        const compiled = await compiler.compile(
          source,
          id,
          (typeof ssr === "object" ? (ssr as any).ssr : ssr)
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

        if (devServer) {
          const templateName = getBasenameWithoutExt(id);
          const optionalFilePrefix =
            path.dirname(id) +
            path.sep +
            (templateName === "index" ? "" : `${templateName}.`);

          for (const file of meta.watchFiles!) {
            this.addWatchFile(file);
          }

          transformOptionalFiles.set(id, [
            `${optionalFilePrefix}style.*`,
            `${optionalFilePrefix}component.*`,
            `${optionalFilePrefix}component-browser.*`,
            `${optionalFilePrefix}marko-tag.json`,
          ]);

          transformWatchFiles.set(id, meta.watchFiles!);
        }
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
            let chunkId = fileName + htmlExt;
            let chunk = bundle[chunkId];

            if (!chunk) {
              // In vite 2.8.x it gave us back posix paths, but in 2.9 we can get windows paths.
              // so we have to check for both.
              chunkId = chunkId.replace(/\//g, "\\");
              chunk = bundle[chunkId];
            }

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
    const markoFile = path.posix.join(root, serverEntries[id]);
    const htmlFile = markoFile + htmlExt;
    virtualFiles.set(htmlFile, {
      code: generateInputDoc(markoFile),
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

function fileNameToURL(fileName: string, root: string) {
  const relativeURL = path.posix.relative(
    pathToFileURL(root).pathname,
    pathToFileURL(fileName).pathname
  );
  if (relativeURL[0] === ".") {
    throw new Error(
      "@marko/vite: Entry templates must exist under the current root directory."
    );
  }

  return `/${relativeURL}`;
}

function getBasenameWithoutExt(file: string): string {
  const baseStart = file.lastIndexOf(path.sep) + 1;
  const extStart = file.indexOf(".", baseStart + 1);
  return file.slice(baseStart, extStart);
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}
