import type * as vite from "vite";
import type * as Compiler from "@marko/compiler";
import type { TagDefinition } from "@marko/babel-utils";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import anyMatch from "anymatch";
import { pathToFileURL, fileURLToPath } from "url";
import { relativeImportPath } from "relative-import-path";

import getServerEntryTemplate from "./server-entry-template";
import {
  generateInputDoc,
  generateDocManifest,
  DocManifest,
} from "./manifest-generator";
import esbuildPlugin from "./esbuild-plugin";
import { BuildStore, FileStore } from "./store";

export * from "./store";
export type { BuildStore } from "./store";

declare module "@marko/babel-utils" {
  interface Taglib {
    id: string;
    dirname: string;
    path: string;
    tags: TagDefinition[];
  }
  interface TaglibLookup {
    taglibsById: Record<string, Taglib>;
  }
}

export interface Options {
  // Defaults to true, set to false to disable automatic component discovery and hydration.
  linked?: boolean;
  // Override the Marko compiler instance being used. (primarily for tools wrapping this module)
  compiler?: string;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // If set, will use the provided string as a variable name and prefix all assets paths with that variable.
  basePathVar?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: Compiler.Config["babelConfig"];
  // Store to use between SSR and client builds, defaults to file system
  store?: BuildStore;
}

interface BrowserManifest {
  [id: string]: DocManifest;
}

interface ServerManifest {
  entries: {
    [entryId: string]: string;
  };
  entrySources: {
    [entryId: string]: string;
  };
  chunksNeedingAssets: string[];
}

interface VirtualFile {
  code: string;
  map?: any;
}

type DeferredPromise<T> = Promise<T> & {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

const POSIX_SEP = "/";
const WINDOWS_SEP = "\\";

const normalizePath =
  path.sep === WINDOWS_SEP
    ? (id: string) => id.replace(/\\/g, POSIX_SEP)
    : (id: string) => id;
const virtualFiles = new Map<
  string,
  VirtualFile | DeferredPromise<VirtualFile>
>();
const queryReg = /\?marko-.+$/;
const browserEntryQuery = "?marko-browser-entry";
const serverEntryQuery = "?marko-server-entry";
const virtualFileQuery = "?marko-virtual";
const manifestFileName = "manifest.json";
const markoExt = ".marko";
const htmlExt = ".html";
const resolveOpts = { skipSelf: true };
const cache = new Map<unknown, unknown>();
const thisFile =
  typeof __filename === "string" ? __filename : fileURLToPath(import.meta.url);

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  let compiler: typeof Compiler;
  const { runtimeId, basePathVar, linked = true } = opts;
  const baseConfig: Compiler.Config = {
    cache,
    runtimeId,
    sourceMaps: true,
    writeVersionComment: false,
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

  const resolveViteVirtualDep: Compiler.Config["resolveVirtualDependency"] = (
    from,
    dep
  ) => {
    const query = `${virtualFileQuery}&id=${encodeURIComponent(
      normalizePath(dep.virtualPath)
    )}`;
    const normalizedFrom = normalizePath(from);
    const id = normalizePath(normalizedFrom) + query;

    if (devServer) {
      const prev = virtualFiles.get(id);
      if (isDeferredPromise(prev)) {
        prev.resolve(dep);
      }
    }

    virtualFiles.set(id, dep);
    return `./${path.posix.basename(normalizedFrom) + query}`;
  };

  const ssrConfig: Compiler.Config = {
    ...baseConfig,
    resolveVirtualDependency: resolveViteVirtualDep,
    output: "html",
  };

  const domConfig: Compiler.Config = {
    ...baseConfig,
    resolveVirtualDependency: resolveViteVirtualDep,
    output: "dom",
  };

  const hydrateConfig: Compiler.Config = {
    ...baseConfig,
    resolveVirtualDependency: resolveViteVirtualDep,
    output: "hydrate",
  };

  let root: string;
  let devEntryFile: string;
  let devEntryFilePosix: string;
  let isBuild = false;
  let isSSRBuild = false;
  let devServer: vite.ViteDevServer;
  let registeredTag: string | false = false;
  let serverManifest: ServerManifest | undefined;
  let store: BuildStore;
  let cjsImports:
    | Map<string, { template: string; esmWrapper?: string }>
    | undefined;
  let basePath = "/";
  const entrySources = new Map<string, string>();
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
        compiler.configure(baseConfig);
        root = normalizePath(config.root || process.cwd());
        devEntryFile = path.join(root, "index.html");
        devEntryFilePosix = normalizePath(devEntryFile);
        isBuild = env.command === "build";
        isSSRBuild = isBuild && linked && Boolean(config.build!.ssr);
        store =
          opts.store ||
          new FileStore(
            `marko-vite-${crypto.createHash("SHA1").update(root).digest("hex")}`
          );

        if (linked && !registeredTag) {
          // Here we inject either the watchMode vite tag, or the build one.
          const transformer = path.resolve(
            thisFile,
            "../render-assets-transform"
          );
          registeredTag = normalizePath(
            path.resolve(thisFile, "../components", "vite.marko")
          );
          compiler.taglib.register("@marko/vite", {
            "<_vite>": { template: registeredTag },
            "<head>": { transformer },
            "<body>": { transformer },
          });
        }

        const lookup = compiler.taglib.buildLookup(root);
        const taglibDeps: string[] = [];
        const optimizeTaglibDeps: string[] = [];

        for (const name in lookup.taglibsById) {
          const taglib = lookup.taglibsById[name];
          if (
            !/^marko-(.+-)?core$/.test(taglib.id) &&
            /[\\/]node_modules[\\/]/.test(taglib.dirname)
          ) {
            let isEsm: boolean | undefined;
            for (const tagName in taglib.tags) {
              const tag: TagDefinition = taglib.tags[tagName];
              const entry = tag.template || tag.renderer;

              if (entry) {
                const relativePath = relativeImportPath(devEntryFile, entry);
                taglibDeps.push(relativePath);

                if (
                  isBuild ||
                  (isEsm ??= getModuleType(taglib.path) === "esm")
                ) {
                  optimizeTaglibDeps.push(relativePath);
                } else {
                  (cjsImports ??= new Map()).set(normalizePath(entry), {
                    template: tag.template,
                  });
                }
              }
            }
          }
        }

        const optimizeDeps = (config.optimizeDeps ??= {});
        optimizeDeps.include = Array.from(
          new Set([
            ...(optimizeDeps.include || []),
            ...compiler.getRuntimeEntryFiles("dom", opts.translator),
            ...compiler.getRuntimeEntryFiles("html", opts.translator),
            ...optimizeTaglibDeps,
          ])
        );

        const optimizeExtensions = (optimizeDeps.extensions ??= []);
        optimizeExtensions.push(".marko");

        const esbuildOptions = (optimizeDeps.esbuildOptions ??= {});
        const esbuildPlugins = (esbuildOptions.plugins ??= []);
        esbuildPlugins.push(esbuildPlugin(compiler, baseConfig));

        const ssr = (config.ssr ??= {});
        if (ssr.noExternal !== true) {
          ssr.noExternal = Array.from(
            new Set(
              (taglibDeps as (string | RegExp)[]).concat(ssr.noExternal || [])
            )
          );
        }

        if (basePathVar) {
          config.experimental ??= {};

          if (config.experimental.renderBuiltUrl) {
            throw new Error(
              "Cannot use @marko/vite `basePathVar` with Vite's `renderBuiltUrl` option."
            );
          }

          config.experimental.renderBuiltUrl = (
            fileName,
            { hostType, ssr }
          ) => {
            switch (hostType) {
              case "html":
                return fileName;
              case "js":
                return {
                  runtime: `${
                    ssr
                      ? basePathVar
                      : `$mbp${runtimeId ? `_${runtimeId}` : ""}`
                  }+${JSON.stringify(fileName)}`,
                };
              default:
                return { relative: true };
            }
          };
        }
      },
      configResolved(config) {
        basePath = config.base;
      },
      configureServer(_server) {
        ssrConfig.hot = domConfig.hot = true;
        devServer = _server;
        devServer.watcher.on("all", (type, filename) => {
          if (type === "unlink") {
            entrySources.delete(filename);
            transformWatchFiles.delete(filename);
            transformOptionalFiles.delete(filename);
          }

          for (const [id, files] of transformWatchFiles) {
            if (anyMatch(files, filename)) {
              devServer.watcher.emit("change", id);
            }
          }

          if (type === "add" || type === "unlink") {
            for (const [id, files] of transformOptionalFiles) {
              if (anyMatch(files, filename)) {
                devServer.watcher.emit("change", id);
              }
            }
          }
        });
      },

      handleHotUpdate(ctx) {
        compiler.taglib.clearCaches();
        baseConfig.cache!.clear();

        for (const mod of ctx.modules) {
          if (mod.id && virtualFiles.has(mod.id)) {
            virtualFiles.set(mod.id, createDeferredPromise());
          }
        }
      },

      async buildStart(inputOptions) {
        if (isBuild && linked && !isSSRBuild) {
          try {
            serverManifest = JSON.parse(
              (await store.get(manifestFileName))!
            ) as ServerManifest;
            inputOptions.input = toHTMLEntries(root, serverManifest.entries);
            for (const entry in serverManifest.entrySources) {
              entrySources.set(
                normalizePath(path.resolve(root, entry)),
                serverManifest.entrySources[entry]
              );
            }
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
          (importer !== devEntryFile ||
            normalizePath(importer) !== devEntryFilePosix) && // Vite tries to resolve against an `index.html` in some cases, we ignore it here.
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

        if (importer) {
          const importerQuery = getMarkoQuery(importer);
          if (importerQuery) {
            importer = importer.slice(0, -importerQuery.length);

            if (importee[0] === ".") {
              const resolved = normalizePath(
                path.resolve(importer, "..", importee)
              );
              if (resolved === normalizePath(importer)) return resolved;
            }

            return this.resolve(importee, importer, resolveOpts);
          }
        }

        return null;
      },
      async load(id) {
        if (cjsImports?.has(id)) {
          const tag = cjsImports.get(id)!;
          if (!tag.esmWrapper) {
            const { ast } = await compiler.compileFile(tag.template, {
              output: "source",
              ast: true,
              sourceMaps: false,
              code: false,
            });
            tag.esmWrapper = await createEsmWrapper(
              id,
              getExportIdentifiers(ast)
            );
          }
          return tag.esmWrapper;
        }

        switch (getMarkoQuery(id)) {
          case serverEntryQuery: {
            const fileName = id.slice(0, -serverEntryQuery.length);
            let entryData: string;
            entrySources.set(fileName, "");

            if (isBuild) {
              const relativeFileName = path.posix.relative(root, fileName);
              const entryId = toEntryId(relativeFileName);
              serverManifest ??= {
                entries: {},
                entrySources: {},
                chunksNeedingAssets: [],
              };
              serverManifest.entries[entryId] = relativeFileName;
              entryData = JSON.stringify(entryId);
            } else {
              entryData = JSON.stringify(
                await generateDocManifest(
                  basePath,
                  await devServer.transformIndexHtml(
                    "/",
                    generateInputDoc(posixFileNameToURL(fileName, root))
                  )
                )
              );
            }

            return getServerEntryTemplate({
              fileName,
              entryData,
              runtimeId,
              basePathVar,
            });
          }
          case browserEntryQuery: {
            // The goal below is to use the original source content
            // for all browser entries rather than load the content
            // from disk again. This is to support virtual Marko entry files.
            return entrySources.get(id.slice(0, -browserEntryQuery.length));
          }
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
        const isSSR = typeof ssr === "object" ? ssr.ssr : ssr;
        const query = getMarkoQuery(id);

        if (query && !query.startsWith(virtualFileQuery)) {
          id = id.slice(0, -query.length);

          if (query === serverEntryQuery) {
            id = `${id.slice(0, -markoExt.length)}.entry.marko`;
          }
        }

        if (!isMarkoFile(id) || cjsImports?.has(id)) {
          return null;
        }

        if (isSSR && linked && entrySources.has(id)) {
          entrySources.set(id, source);

          if (serverManifest) {
            serverManifest.entrySources[path.posix.relative(root, id)] = source;
          }
        }

        const compiled = await compiler.compile(
          source,
          id,
          isSSR
            ? ssrConfig
            : query === browserEntryQuery
            ? hydrateConfig
            : domConfig
        );

        const { map, meta } = compiled;
        let { code } = compiled;

        if (query !== browserEntryQuery && devServer) {
          code += `\nif (import.meta.hot) import.meta.hot.accept(() => {});`;
        }

        if (devServer) {
          const templateName = getPosixBasenameWithoutExt(id);
          const optionalFilePrefix =
            path.dirname(id) +
            path.sep +
            (templateName === "index" ? "" : `${templateName}.`);

          for (const file of meta.watchFiles) {
            this.addWatchFile(file);
          }

          transformOptionalFiles.set(id, [
            `${optionalFilePrefix}style.*`,
            `${optionalFilePrefix}component.*`,
            `${optionalFilePrefix}component-browser.*`,
            `${optionalFilePrefix}marko-tag.json`,
          ]);

          transformWatchFiles.set(id, meta.watchFiles);
        }
        return { code, map, meta: isBuild ? { source } : undefined };
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

          await store.set(manifestFileName, JSON.stringify(serverManifest));
        } else {
          const browserManifest: BrowserManifest = {};

          for (const entryId in serverManifest!.entries) {
            const fileName = serverManifest!.entries[entryId];
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
                basePath,
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

          for (const fileName of serverManifest!.chunksNeedingAssets) {
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

function toEntryId(id: string) {
  const lastSepIndex = id.lastIndexOf(POSIX_SEP);
  let name = id.slice(lastSepIndex + 1, id.indexOf(".", lastSepIndex));

  if (name === "index" || name === "template") {
    name = id.slice(
      id.lastIndexOf(POSIX_SEP, lastSepIndex - 1) + 1,
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

function posixFileNameToURL(fileName: string, root: string) {
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

function getPosixBasenameWithoutExt(file: string): string {
  const baseStart = file.lastIndexOf(POSIX_SEP) + 1;
  const extStart = file.indexOf(".", baseStart + 1);
  return file.slice(baseStart, extStart);
}

function createDeferredPromise<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  }) as DeferredPromise<T>;
  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
}

function isDeferredPromise<T>(obj: unknown): obj is DeferredPromise<T> {
  return typeof (obj as Promise<T>)?.then === "function";
}

function isEmpty(obj: unknown) {
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  return true;
}

function findPackageJson(
  file: string,
  root: string = process.cwd()
): string | null {
  let currentDir = path.dirname(file);
  while (currentDir !== root && currentDir.length > root.length) {
    const pkgPath = path.join(currentDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      return pkgPath;
    }
    currentDir = path.dirname(currentDir);
  }
  return null;
}

const moduleTypeMap = new Map<string, "esm" | "cjs">();
function getModuleType(file: string): "esm" | "cjs" {
  const pkgPath = findPackageJson(file);
  if (pkgPath) {
    let moduleType = moduleTypeMap.get(pkgPath);
    if (!moduleType) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      moduleType = pkg.type === "module" || pkg.exports ? "esm" : "cjs";
      moduleTypeMap.set(pkgPath, moduleType);
    }
    return moduleType;
  }
  return "esm";
}

let requireHookInstalled = false;
async function createEsmWrapper(
  url: string,
  exports: Set<string>
): Promise<string> {
  if (!requireHookInstalled) {
    await import("@marko/compiler/register.js");
    requireHookInstalled = true;
  }

  let code = `import { createRequire } from 'module';
const mod = createRequire(import.meta.url)('${url}');
`;

  let namedExports: string | undefined;
  for (const name of exports) {
    if (name === "default") {
      code += "export default mod.default;\n";
    } else if (namedExports) {
      namedExports += `, ${name}`;
    } else {
      namedExports = name;
    }
  }
  if (namedExports) {
    code += `export const { ${namedExports} } = mod;\n`;
  }
  return code;
}

function getExportIdentifiers(ast: Compiler.types.File) {
  const exports = new Set<string>();
  for (const node of ast.program.body) {
    switch (node.type) {
      case "ExportDefaultDeclaration":
      case "MarkoTag":
        exports.add("default");
        break;
      case "ExportNamedDeclaration":
        if (node.declaration) {
          for (const declarator of (node.declaration as any).declarations) {
            exports.add(declarator.id.name);
          }
        }
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ExportSpecifier") {
            exports.add(specifier.exported.name);
          }
        }
        break;
      case "ExportAllDeclaration":
        throw new Error(
          'Re-exporting using `export * from "..."` is not supported.'
        );
    }
  }
  return exports;
}
