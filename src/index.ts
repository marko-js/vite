import os from "os";
import fs from "fs";
import path from "path";
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

const name = "marko-vite";
const virtualFiles = new Map<string, { code: string; map?: any }>();
const defaultCompiler = require.resolve("@marko/compiler");
const prefixReg = /^\0?marko-[^:]+:/;
const browserEntryPrefix = "\0marko-browser-entry:";
const serverEntryPrefix = "\0marko-server-entry:";
const resolveOpts = { skipSelf: true };
const markoExt = ".marko";
const htmlExt = ".html";
let tempDir: Promise<string> | undefined;

export default function markoPlugin(opts: Options = {}): vite.Plugin {
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
        name,
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
      const resolved = path.resolve(from, "..", dep.virtualPath);
      virtualFiles.set(resolved, dep);
      return dep.virtualPath;
    },
    output: "dom",
  };

  const hydrateConfig: Compiler.Config = {
    ...domConfig,
    output: "hydrate",
  };

  let registeredViteTag: string | false = false;
  let serverManifest: ServerManifest | undefined;
  let isBuild = false;
  let isDOM = false;
  let root: string;
  let server: vite.ViteDevServer;

  return {
    name,
    enforce: "pre", // Must be pre to allow us to resolve assets before vite.
    config(config, env) {
      if (env.command === "build") {
        isBuild = true;
        root = config.root || process.cwd();

        if (linked) {
          config.plugins!.push({
            name: "marko-vite:manifest",
            enforce: "post",
            async generateBundle(_outputOptions, bundle, isWrite) {
              // We push a "post" plugin to ensure vite
              // has added the html file assets.

              if (!isWrite) {
                this.error(
                  `Linked builds are currently only supported when in "write" mode.`
                );
              }

              if (isDOM && serverManifest) {
                const browserManifest: BrowserManifest = {};

                for (const id in serverManifest.entries) {
                  const chunk = bundle[id];

                  if (chunk?.type === "asset") {
                    browserManifest[id] = await generateDocManifest(
                      chunk.source.toString()
                    );

                    delete bundle[id];
                  } else {
                    this.error(
                      `Marko template had unexpected output from vite, ${path.relative(
                        root,
                        serverManifest.entries[id]
                      )}`
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
          } as vite.Plugin);
        }
      }
    },
    configureServer(_server) {
      server = _server;
    },
    async buildStart(inputOptions) {
      if (
        isBuild &&
        linked &&
        Array.isArray(inputOptions.input) &&
        inputOptions.input.some(isHTMLFile)
      ) {
        const serverMetaFile = await getServerManifestFile();
        this.addWatchFile(serverMetaFile);
        isDOM = true;

        try {
          serverManifest = JSON.parse(
            await fs.promises.readFile(serverMetaFile, "utf-8")
          ) as ServerManifest;
          inputOptions.input = toHTMLEntries(serverManifest.entries);
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
    async resolveId(importee, importer, _, ssr) {
      let importeePrefix = "";
      let importerPrefix = "";
      let importerPrefixMatch;

      if (importer) {
        if ((importerPrefixMatch = prefixReg.exec(importer))) {
          [importerPrefix] = importerPrefixMatch;
          importer = importer.slice(importerPrefix.length);
        }

        if (ssr) {
          // this code looks for `.marko` files that are imported from non `.marko` files.
          // That heuristic is what we use to tell which `marko` files to request assets for.
          // This code prefixes those `.marko` files with a marker to know that assets are needed.
          if (linked && isMarkoFile(importee) && !isMarkoFile(importer)) {
            importeePrefix = serverEntryPrefix;
          }
        } else {
          // this code checks for `.marko` files which are the imported directly
          // from an html script. These top level Marko files are compiled
          // to include only the necessary code to "hydrate" the component in the browser.
          // This code prefixes those `.marko` files with a marker to know to treat it differently.
          if (isHTMLFile(importer) && isMarkoFile(importee)) {
            importeePrefix = browserEntryPrefix;
          }
        }
      }

      const virtualFile = importer
        ? path.resolve(importer, "..", importee)
        : path.resolve(importee);

      if (virtualFiles.has(virtualFile)) {
        return virtualFile;
      }

      if (importerPrefix || importeePrefix) {
        const resolved = await this.resolve(importee, importer, resolveOpts);

        if (resolved) {
          resolved.id = importeePrefix + resolved.id;
          return resolved;
        }
      }

      return null;
    },
    async load(id, ssr) {
      if (linked && ssr) {
        if (!registeredViteTag) {
          // Here we inject either the watchMode vite tag, or the build one.
          registeredViteTag = path.resolve(
            __dirname.slice(0, __dirname.lastIndexOf("vite") + 4),
            "components",
            this.meta.watchMode ? "vite-watch.marko" : "vite.marko"
          );
          compiler.taglib.register("@marko/vite", {
            "<vite>": {
              template: registeredViteTag,
            },
          });
        }

        if (id.startsWith(serverEntryPrefix)) {
          // This code is looking for the markers added from the resolver above.
          // It then returns a wrapper template that tells the <vite> tag what
          // entry point we are rendering.
          //
          // We also keep track of all of the Marko entry files here to tell
          // the browser compilers what to bundle in build mode.
          const fileName = id.slice(serverEntryPrefix.length);
          const entryId = path.posix.relative(root!, fileName + htmlExt);

          if (isBuild) {
            serverManifest ??= {
              entries: {},
              chunksNeedingAssets: [],
            };
            serverManifest.entries[entryId] = fileName;
          }

          return getServerEntryTemplate({
            runtimeId,
            templatePath: `./${path.basename(id)}`,
            entryData: JSON.stringify(
              isBuild
                ? entryId
                : await generateDocManifest(
                    await server.transformIndexHtml(
                      "/",
                      generateInputDoc(entryId)
                    )
                  )
            ),
          });
        }
      }

      const virtualFile = virtualFiles.get(id);

      if (virtualFile) {
        return virtualFile;
      }

      const prefixMatch = prefixReg.exec(id);

      if (prefixMatch) {
        return fs.promises.readFile(id.slice(prefixMatch[0].length), "utf-8");
      }

      return null;
    },
    async transform(source, id, ssr) {
      if (!isMarkoFile(id)) {
        return null;
      }

      const prefixMatch = prefixReg.exec(id);
      let prefix: string | undefined;

      if (prefixMatch) {
        prefix = prefixMatch[0];
        id = id.slice(prefix.length);
      }

      const { code, map, meta } = await compiler.compile(
        source,
        id,
        ssr
          ? ssrConfig
          : prefix === browserEntryPrefix
          ? hydrateConfig
          : domConfig
      );

      for (const watchFile of meta.watchFiles!) {
        this.addWatchFile(watchFile);
      }

      return { code, map };
    },

    async generateBundle(outputOptions, bundle) {
      if (linked && !isDOM) {
        let hasViteTag = false;
        const dir = outputOptions.dir
          ? path.resolve(outputOptions.dir)
          : path.resolve(outputOptions.file!, "..");

        if (!serverManifest) {
          this.error(
            "No Marko files were found when bundling the server in linked mode."
          );
        }

        for (const fileName in bundle) {
          const chunk = bundle[fileName];

          if (chunk.type === "chunk") {
            for (const id in chunk.modules) {
              if (id === registeredViteTag) {
                hasViteTag = true;
                serverManifest.chunksNeedingAssets.push(
                  path.resolve(dir, fileName)
                );
                break;
              }
            }
          }
        }

        if (!hasViteTag) {
          this.warn(
            "The <vite> tag was not discovered when bundling the server. This means no client side assets will be served to the browser."
          );
        }

        await fs.promises.writeFile(
          await getServerManifestFile(),
          JSON.stringify(serverManifest)
        );
      }
    },
  };
}

function isHTMLFile(file: string) {
  return file.endsWith(htmlExt);
}

function isMarkoFile(file: string) {
  return file.endsWith(markoExt);
}

function toHTMLEntries(serverEntries: ServerManifest["entries"]) {
  const result: string[] = [];

  for (const id in serverEntries) {
    const markoFile = serverEntries[id];
    const htmlFile = markoFile + htmlExt;
    virtualFiles.set(htmlFile, {
      code: generateInputDoc(markoFile),
    });
    result.push(htmlFile);
  }

  return result;
}

async function getServerManifestFile() {
  return path.join(await getTempDir(), "server-meta.json");
}

function getTempDir() {
  return (
    tempDir ||
    (tempDir = fs.promises.mkdtemp(path.join(os.tmpdir(), "marko-vite-")))
  );
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}
