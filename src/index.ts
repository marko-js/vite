import * as compiler from "@marko/compiler";
import anyMatch from "anymatch";
import crypto from "crypto";
import glob from "fast-glob";
import fs from "fs";
import path from "path";
import { relativeImportPath } from "relative-import-path";
import type * as vite from "vite";

import cjsInteropTranslate, {
  cjsInteropHelpersCode,
  cjsInteropHelpersId,
} from "./cjs-interop-translate";
import globImportTransformer from "./glob-import-transform";
import {
  type DocManifest,
  generateDocManifest,
  generateInputDoc,
} from "./manifest-generator";
import { normalizePath, POSIX_SEP, WINDOWS_SEP } from "./normalize-path";
import { ReadOncePersistedStore } from "./read-once-persisted-store";
import relativeAssetsTransform from "./relative-assets-transform";
import {
  getRenderAssetsRuntime,
  renderAssetsRuntimeId,
} from "./render-assets-runtime";
import renderAssetsTransform from "./render-assets-transform";
import { isCJSModule } from "./resolve";
import rolldownPlugin from "./rolldown-plugin";
import getServerEntryTemplate from "./server-entry-template";

export namespace API {
  export type getMarkoAssetCodeForEntry = (id: string) => string | void;
}

export interface Options {
  // Defaults to true, set to false to disable automatic component discovery and hydration.
  linked?: boolean;
  // Sets a custom runtimeId to avoid conflicts with multiple copies of Marko on the same page.
  runtimeId?: string;
  // Overrides the Marko translator being used.
  translator?: string;
  // If set, will use the provided string as a variable name and prefix all assets paths with that variable.
  basePathVar?: string;
  // Overrides the Babel config that Marko will use.
  babelConfig?: compiler.Config["babelConfig"];
  // Filter marko files used as entries
  isEntry?: (importee: string, importer: string) => boolean;
}

enum InternalFileKind {
  clientEntry,
  serverEntry,
  virtual,
}

interface ClientManifest {
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
  ssrAssetIds: string[];
}

interface VirtualFile {
  code: string;
  map?: any;
}

type DeferredPromise<T> = Promise<T> & {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

const TEMPLATE_ID_HASH_OPTS = { outputLength: 3 };
const virtualFiles = new Map<
  string,
  VirtualFile | DeferredPromise<VirtualFile>
>();
const importTagReg = /^<([^>]+)>$/;
const optionalWatchFileReg =
  /[\\/](?:([^\\/]+)\.)?(?:marko-tag.json|(?:style|component|component-browser)\.\w+)$/;
const noClientAssetsRuntimeId = "\0no_client_bundles.mjs";
const markoExt = ".marko";
const htmlExt = ".html";
const clientEntryExt = ".client-entry.marko";
const serverEntryExt = ".server-entry.marko";
const virtualFileInfix = "-virtual";
const virtualFileReg = /^(.*\.marko)-virtual((?:\.[^\\/?]+)+)$/;
const resolveOpts = { skipSelf: true };
const cache = new Map<unknown, unknown>();
const babelConfig = {
  babelrc: false,
  configFile: false,
  browserslistConfigFile: false,
  caller: {
    name: "@marko/vite",
    supportsStaticESM: true,
    supportsDynamicImport: true,
    supportsTopLevelAwait: true,
    supportsExportNamespaceFrom: true,
  },
};
const optimizeKnownTemplatesForRoot = new Map<string, string[]>();
let registeredTagLib = false;

// This package has a dependency on @parcel/source-map which uses native addons.
// Some environments like Stackblitz don't support loading these. So... load it
// with a dynamic import to avoid everything failing.
let cjsToEsm: typeof import("@chialab/cjs-to-esm").transform | null | undefined;

function noop(): undefined {}

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  let { linked = true } = opts;
  let runtimeId: string | undefined;
  let basePathVar: string | undefined;
  let baseConfig: compiler.Config;
  let clientConfig: compiler.Config;
  let clientEntryConfig: compiler.Config;
  let serverConfig: compiler.Config;
  let serverCJSConfig: compiler.Config;
  let serverEntryConfig: compiler.Config;
  let virtualFileCacheDirPromise: Promise<unknown> | undefined;

  const resolveVirtualDependency: compiler.Config["resolveVirtualDependency"] =
    (from, dep) => {
      const { virtualPath } = dep;
      const normalizedFrom = normalizePath(from);
      const sourceBaseName = path.basename(from);
      const virtualBaseName = path.basename(virtualPath);
      const virtualExt =
        virtualFileInfix +
        (virtualBaseName.startsWith(sourceBaseName)
          ? virtualBaseName.slice(sourceBaseName.length)
          : `.${virtualBaseName.replace(/[^a-z0-9_.-]+/gi, "_")}`);
      const id = normalizedFrom + virtualExt;
      const virtualFile = {
        code: dep.code,
        map: stripSourceRoot(dep.map),
      };

      if (devServer) {
        const prev = virtualFiles.get(id);
        if (isDeferredPromise(prev)) {
          prev.resolve(virtualFile);
        }
      }

      virtualFiles.set(id, virtualFile);
      return `./${sourceBaseName + virtualExt}`;
    };

  let root: string;
  let cacheDir: string | undefined;
  let rootResolveFile: string;
  let devEntryFile: string;
  let devEntryFilePosix: string;
  let renderAssetsRuntimeCode: string;
  let isTest = false;
  let isBuild = false;
  let hasBuildApp = false;
  let isBuildApp = false;
  let devServer: vite.ViteDevServer;
  let serverManifest: ServerManifest | undefined;
  let basePath = "/";
  let getMarkoAssetFns: undefined | API.getMarkoAssetCodeForEntry[];
  let checkIsEntry: NonNullable<Options["isEntry"]> = () => true;

  const entryIds = new Set<string>();
  const cachedSources = new Map<string, string>();
  const transformWatchFiles = new Map<string, string[]>();
  const store = new ReadOncePersistedStore<ServerManifest>(
    `vite-marko${runtimeId ? `-${runtimeId}` : ""}`,
  );
  const isTagsApi = (api: undefined | string) => api === "tags";

  return [
    {
      name: "marko-vite:pre",
      enforce: "pre", // Must be pre to allow us to resolve assets before vite.
      sharedDuringBuild: true,
      async buildApp(builder) {
        const { ssr, client } = builder.environments;
        isBuildApp = true;
        if (hasBuildApp || !linked || !ssr || !client) return;
        await builder.build(ssr);
        await builder.build(client);
      },
      async config(config, env) {
        let optimize = env.mode === "production";
        isTest = env.mode === "test";
        isBuild = env.command === "build";
        hasBuildApp = !!config.builder?.buildApp;

        if (isTest) {
          const { test } = config as any;
          linked = false;
          if ((test.environment as string | undefined)?.includes("dom")) {
            config.resolve ??= {};
            config.resolve.conditions ??= [];
            config.resolve.conditions.push("browser");
            (test.execArgv ||= []).push("-C", "browser");
          }
        }

        if ("MARKO_DEBUG" in process.env) {
          optimize =
            process.env.MARKO_DEBUG === "false" ||
            process.env.MARKO_DEBUG === "0";
        } else {
          process.env.MARKO_DEBUG = optimize ? "false" : "true";
        }

        runtimeId = opts.runtimeId;
        basePathVar = opts.basePathVar;
        checkIsEntry = opts.isEntry || checkIsEntry;

        if ("BASE_URL" in process.env && config.base == null) {
          config.base = process.env.BASE_URL;
        }

        root = normalizePath(config.root || process.cwd());
        rootResolveFile = path.join(root, "_.js");
        baseConfig = {
          cache,
          optimize,
          runtimeId,
          babelConfig,
          sourceMaps: true,
          writeVersionComment: false,
          resolveVirtualDependency,
          optimizeKnownTemplates: optimize
            ? getKnownTemplates(root)
            : undefined,
        };

        if (linked) {
          (baseConfig as any).markoViteLinked = linked;
        }

        const cjsInteropMarkoVite = {
          filter:
            isBuild || isTest ? undefined : (path: string) => !/^\./.test(path),
        };

        clientConfig = {
          ...baseConfig,
          output: "dom",
        };
        clientEntryConfig = {
          ...baseConfig,
          output: "hydrate",
          sourceMaps: false,
        };
        serverConfig = {
          ...baseConfig,
          output: "html",
        };
        serverCJSConfig = {
          ...serverConfig,
          cjsInteropMarkoVite,
        } as any;
        serverEntryConfig = {
          ...serverConfig,
          sourceMaps: false,
        };

        compiler.configure(baseConfig);
        devEntryFile = path.join(root, "index.html");
        devEntryFilePosix = normalizePath(devEntryFile);
        renderAssetsRuntimeCode = getRenderAssetsRuntime({
          isBuild,
          basePathVar,
          runtimeId,
        });

        if (!registeredTagLib) {
          registeredTagLib = true;
          compiler.taglib.register("@marko/vite", {
            translate: cjsInteropTranslate,
            transform: globImportTransformer,
            "<head>": { transformer: renderAssetsTransform },
            "<body>": { transformer: renderAssetsTransform },
            "<*>": { transformer: relativeAssetsTransform },
          });
        }

        if (basePathVar) {
          config.experimental ??= {};

          if (config.experimental.renderBuiltUrl) {
            throw new Error(
              "Cannot use @marko/vite `basePathVar` with Vite's `renderBuiltUrl` option.",
            );
          }

          const assetsDir =
            config.build?.assetsDir?.replace(/[/\\]$/, "") ?? "assets";
          const assetsDirLen = assetsDir.length;
          const assetsDirEnd = assetsDirLen + 1;
          const trimAssertsDir = (fileName: string) => {
            if (fileName.startsWith(assetsDir)) {
              switch (fileName[assetsDirLen]) {
                case POSIX_SEP:
                case WINDOWS_SEP:
                  return fileName.slice(assetsDirEnd);
              }
            }

            return fileName;
          };
          config.experimental.renderBuiltUrl = (
            fileName,
            { hostType, ssr },
          ) => {
            switch (hostType) {
              case "html":
                return trimAssertsDir(fileName);
              case "js":
                return {
                  runtime: `${
                    ssr
                      ? basePathVar
                      : `$mbp${runtimeId ? `_${runtimeId}` : ""}`
                  }+${JSON.stringify(trimAssertsDir(fileName))}`,
                };
              default:
                return { relative: true };
            }
          };
        }

        return {
          resolve: {
            alias: [
              {
                find: /^~(?!\/)/,
                replacement: "",
              },
            ],
          },
        };
      },
      configEnvironment(name, config) {
        const isSSR = name === "ssr";

        if (isSSR) {
          const { noExternal } = (config.resolve ??= {});
          if (noExternal !== true) {
            const noExternalReg = /\.marko$/;
            if (noExternal) {
              if (Array.isArray(noExternal)) {
                config.resolve.noExternal = [...noExternal, noExternalReg];
              } else {
                config.resolve.noExternal = [noExternal, noExternalReg];
              }
            } else {
              config.resolve.noExternal = noExternalReg;
            }
          }
        }

        if (isBuild) {
          config.build ??= {};
          if (!config.build.rolldownOptions?.output) {
            config.build.rolldownOptions ??= {};
            config.build.rolldownOptions.output = {
              // By default use `_[hash]` instead of `[name]-[hash]` because for chunk names the `[name]` is
              // not deterministic (it's based on chunk.moduleIds order).
              // For the server build vite will still output code split chunks to the `assets` directory by default.
              // this is problematic since you might have server assets in your client assets folder.
              // Here we change the default chunkFileNames config to instead output to the outDir directly.
              chunkFileNames: isSSR
                ? "_[hash].js"
                : `${config.build?.assetsDir?.replace(/[/\\]$/, "") ?? "assets"}/_[hash].js`,
            };
          }
        } else {
          const optimizeDeps = (config.optimizeDeps ??= {});
          (optimizeDeps.extensions ??= []).push(".marko");

          if (!isSSR) {
            const domDeps = compiler.getRuntimeEntryFiles(
              "dom",
              opts.translator,
            );
            optimizeDeps.include = optimizeDeps.include
              ? [...optimizeDeps.include, ...domDeps]
              : domDeps;
          }

          if (!isTest) {
            optimizeDeps.entries ??= [
              "**/*.marko",
              "!**/__snapshots__/**",
              `!**/__tests__/**`,
              `!**/coverage/**`,
            ];
          }

          (optimizeDeps.rolldownOptions ??= {}).plugins = [
            optimizeDeps.rolldownOptions.plugins || [],
            rolldownPlugin(
              isSSR ? serverConfig : clientConfig,
              virtualFiles,
              async (id) => {
                if (cacheDir) {
                  const file = virtualFiles.get(id);
                  if (file) {
                    await (virtualFileCacheDirPromise ||= fs.promises.mkdir(
                      cacheDir,
                      {
                        recursive: true,
                      },
                    ));
                    const virtualId = virtualPathToCacheFile(
                      id,
                      root,
                      cacheDir,
                    );
                    await fs.promises.writeFile(virtualId, (await file).code);
                    return virtualId;
                  }
                }
              },
            ),
          ];
        }
      },
      configResolved(config) {
        basePath = config.base;
        cacheDir = config.cacheDir && normalizePath(config.cacheDir);
        getMarkoAssetFns = undefined;
        for (const plugin of config.plugins) {
          const fn = plugin.api?.getMarkoAssetCodeForEntry as
            | undefined
            | API.getMarkoAssetCodeForEntry;
          if (fn) {
            if (getMarkoAssetFns) {
              getMarkoAssetFns.push(fn);
            } else {
              getMarkoAssetFns = [fn];
            }
          }
        }
      },
      configureServer(_server) {
        if (!isTest) {
          clientConfig.hot = serverConfig.hot = serverEntryConfig.hot = true;
        }

        devServer = _server;
        devServer.watcher.on("all", (type, originalFileName) => {
          const fileName = normalizePath(originalFileName);
          cachedSources.delete(fileName);

          if (type === "unlink") {
            entryIds.delete(fileName);
            transformWatchFiles.delete(fileName);
          }

          for (const [id, files] of transformWatchFiles) {
            if (anyMatch(files, fileName)) {
              devServer.watcher.emit("change", id);
            }
          }

          if (type === "unlink" || type === "add") {
            const optionalMatch = optionalWatchFileReg.exec(fileName);
            if (optionalMatch) {
              const markoFile =
                fileName.slice(0, optionalMatch.index + 1) +
                (optionalMatch[1] || "index") +
                ".marko";
              if (transformWatchFiles.has(markoFile)) {
                devServer.watcher.emit("change", markoFile);
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

      async options(inputOptions) {
        if (linked && isBuild) {
          if (this.environment.name === "ssr") {
            serverManifest = {
              entries: {},
              entrySources: {},
              chunksNeedingAssets: [],
              ssrAssetIds: [],
            };
          } else {
            if (!isBuildApp && !serverManifest) {
              serverManifest = await store.read().catch(noop);
            }

            if (serverManifest) {
              if (isEmpty(serverManifest.entries)) {
                inputOptions.input = noClientAssetsRuntimeId;
              } else {
                inputOptions.input = toHTMLEntries(
                  root,
                  serverManifest.entries,
                );
                for (const entry in serverManifest.entrySources) {
                  const id = normalizePath(path.resolve(root, entry));
                  entryIds.add(id);
                  cachedSources.set(id, serverManifest.entrySources[entry]);
                }
              }
            } else {
              this.error(
                `You must run the "ssr" build before the "browser" build.`,
              );
            }
          }
        }
      },
      async resolveId(importee, importer, importOpts, ssr = importOpts.ssr) {
        switch (importee) {
          case cjsInteropHelpersId:
          case renderAssetsRuntimeId:
          case noClientAssetsRuntimeId:
            return importee;
        }

        if (virtualFiles.has(importee)) {
          return importee;
        }

        if (importer) {
          const tagName = importTagReg.exec(importee)?.[1];
          importer = stripViteQueries(importer);

          if (tagName) {
            const tagDef = compiler.taglib
              .buildLookup(path.dirname(importer))
              .getTag(tagName);
            return tagDef && (tagDef.template || tagDef.renderer);
          }
        }

        let importeeInfo = getMarkoFileInfo(importee);

        if (importeeInfo) {
          if (
            importee[0] !== "." &&
            importee[0] !== "\0" &&
            importeeInfo.kind === InternalFileKind.virtual
          ) {
            return importee;
          }
          importee = importeeInfo.sourceId;
        } else if (!(importOpts as any).scan) {
          if (
            ssr &&
            linked &&
            importer &&
            importer[0] !== "\0" &&
            (importer !== devEntryFile ||
              normalizePath(importer) !== devEntryFilePosix) && // Vite tries to resolve against an `index.html` in some cases, we ignore it here.
            isMarkoFile(importee) &&
            !getMarkoFileInfo(importer) &&
            !isMarkoFile(importer) &&
            checkIsEntry(
              normalizePath(path.resolve(importer, "..", importee)),
              importer,
            )
          ) {
            importeeInfo = {
              kind: InternalFileKind.serverEntry,
              sourceId: importee as `${string}.marko`,
            };
          } else if (
            !ssr &&
            isBuild &&
            importer &&
            isMarkoFile(importee) &&
            this.getModuleInfo(importer)?.isEntry
          ) {
            importeeInfo = {
              kind: InternalFileKind.clientEntry,
              sourceId: importee as `${string}.marko`,
            };
          }
        }

        if (importeeInfo) {
          const resolved =
            importee[0] === "."
              ? {
                  id: normalizePath(
                    importer
                      ? path.resolve(importer, "..", importee)
                      : path.resolve(root, importee),
                  ),
                }
              : await this.resolve(importee, importer, resolveOpts);

          if (resolved) {
            resolved.id = toMarkoFileId(
              stripViteQueries(resolved.id),
              importeeInfo,
            );
          }

          return resolved;
        }

        if (importer) {
          const importerInfo = getMarkoFileInfo(importer);
          if (importerInfo) {
            importer = importerInfo.sourceId;

            if (importee[0] === ".") {
              const resolved = normalizePath(
                path.resolve(importer, "..", importee),
              );
              if (resolved === normalizePath(importer)) return resolved;
            }

            return this.resolve(importee, importer, resolveOpts);
          }
        }

        return null;
      },
      async load(rawId) {
        const id = stripViteQueries(rawId);

        switch (id) {
          case cjsInteropHelpersId:
            return cjsInteropHelpersCode;
          case renderAssetsRuntimeId:
            return renderAssetsRuntimeCode;
          case noClientAssetsRuntimeId:
            return "NO_CLIENT_ASSETS";
        }

        const info = getMarkoFileInfo(id);
        if (info) {
          switch (info.kind) {
            case InternalFileKind.serverEntry: {
              entryIds.add(info.sourceId);
              return (
                cachedSources.get(info.sourceId) ||
                (await fs.promises
                  .readFile(info.sourceId, "utf8")
                  .catch(noop)) ||
                null
              );
            }
            case InternalFileKind.clientEntry: {
              // The goal below is to cached source content when in linked mode
              // to avoid loading from disk for both server and browser builds.
              // This is to support virtual Marko entry files.
              return (
                cachedSources.get(info.sourceId) ||
                (await fs.promises
                  .readFile(info.sourceId, "utf8")
                  .catch(noop)) ||
                null
              );
            }
            case InternalFileKind.virtual:
              return (
                virtualFiles.get(id) ||
                cachedSources.get(id) ||
                (cacheDir &&
                  fs.promises
                    .readFile(
                      virtualPathToCacheFile(id, root, cacheDir),
                      "utf8",
                    )
                    .then((code) => {
                      virtualFiles.set(id, { code });
                      return code;
                    })
                    .catch(() => {
                      return null;
                    }))
              );
          }
        }

        return virtualFiles.get(id) || cachedSources.get(id) || null;
      },
      async transform(source, rawId) {
        const resolvedId = stripViteQueries(rawId);
        const info = getMarkoFileInfo(resolvedId);
        let id =
          info?.kind === InternalFileKind.virtual
            ? resolvedId
            : info?.sourceId || resolvedId;
        const isSSR = this.environment.name === "ssr";

        if (info?.kind === InternalFileKind.serverEntry) {
          const fileName = id;
          let mainEntryData: string;
          id = resolvedId;
          cachedSources.set(fileName, source);

          if (isBuild) {
            const relativeFileName = normalizePath(
              path.relative(root, fileName),
            );
            const entryId = toEntryId(relativeFileName);
            serverManifest!.entries[entryId] = relativeFileName;
            serverManifest!.entrySources[relativeFileName] = source;
            mainEntryData = JSON.stringify(entryId);
          } else {
            mainEntryData = JSON.stringify(
              await generateDocManifest(
                basePath,
                await devServer.transformIndexHtml(
                  "/",
                  generateInputDoc(
                    fileNameToURL(toClientEntryId(fileName), root),
                  ),
                ),
              ),
            );
          }

          const entryData = [mainEntryData];
          if (getMarkoAssetFns) {
            for (const getMarkoAsset of getMarkoAssetFns) {
              const asset = getMarkoAsset(fileName);
              if (asset) {
                entryData.push(asset);
              }
            }
          }

          source = await getServerEntryTemplate({
            fileName,
            entryData,
            runtimeId,
            basePathVar: isBuild ? basePathVar : undefined,
            tagsAPI: isTagsApi(
              ("transformRequest" in this.environment
                ? (await this.environment.transformRequest(fileName),
                  this.getModuleInfo(fileName))
                : await this.load({ id: fileName })
              )?.meta.markoAPI,
            ),
          });
        }

        if (!isMarkoFile(id)) {
          if (!isBuild && isSSR) {
            const ext = path.extname(id);
            if (
              ext === ".cjs" ||
              (ext === ".js" && isCJSModule(id, rootResolveFile))
            ) {
              if (cjsToEsm === undefined) {
                try {
                  cjsToEsm = (await import("@chialab/cjs-to-esm")).transform;
                } catch (err) {
                  console.error(err);
                  cjsToEsm = null;
                  return null;
                }
              }
              if (cjsToEsm) {
                try {
                  return await cjsToEsm(source);
                } catch {
                  return null;
                }
              }
            }
          }

          return null;
        }

        if (isSSR) {
          if (linked) {
            cachedSources.set(id, source);
          }

          if (!info && isCJSModule(id, rootResolveFile)) {
            if (isBuild) {
              const { code, map, meta } = await compiler.compile(
                source,
                id,
                serverCJSConfig,
              );

              return {
                code,
                map: stripSourceRoot(map),
                meta: { markoAPI: meta.api },
              };
            }
          }
        }

        const compiled = await compiler.compile(
          source,
          id,
          isSSR
            ? isCJSModule(id, rootResolveFile)
              ? serverCJSConfig
              : info?.kind === InternalFileKind.serverEntry
                ? serverEntryConfig
                : serverConfig
            : info?.kind === InternalFileKind.clientEntry
              ? clientEntryConfig
              : clientConfig,
        );

        const { meta } = compiled;
        let { code } = compiled;

        if (serverManifest && info?.kind === InternalFileKind.clientEntry) {
          for (const assetId of serverManifest.ssrAssetIds) {
            code += `\nimport "${relativeImportPath(id, path.resolve(root, assetId))}";`;
          }
        }

        if (!info && !isTest && devServer && !isTagsApi(meta.api)) {
          code += `\nif (import.meta.hot) import.meta.hot.accept(() => {});`;
        }

        if (devServer) {
          transformWatchFiles.set(id, meta.watchFiles);
        } else {
          for (const file of meta.watchFiles) {
            this.addWatchFile(file);
          }
        }

        return {
          code,
          map: stripSourceRoot(compiled.map),
          meta: { markoAPI: meta.api },
        };
      },
    },
    {
      name: "marko-vite:post",
      apply: "build",
      enforce: "post", // We use a "post" plugin to allow us to read the final generated `.html` from vite.,
      sharedDuringBuild: true,
      transform(_source, id, opts) {
        if (!opts?.ssr && /\.module\.[^.]+(?:\?|$)/.test(id)) {
          // CSS modules in vite tree shake, however when coupled with
          // Marko (which leaves code on the server) this leads to no
          // reference to the css module and causes it to be removed
          // even when it should not be. Here we say all css moduleish
          // files should not tree shake.
          return {
            moduleSideEffects: "no-treeshake",
          };
        }
      },
      async generateBundle(outputOptions, bundle, isWrite) {
        if (!serverManifest) {
          return;
        }

        if (!isWrite) {
          this.error(
            `Linked builds are currently only supported when in "write" mode.`,
          );
        }

        if (this.environment.name === "ssr") {
          const dir = outputOptions.dir
            ? path.resolve(outputOptions.dir)
            : path.resolve(outputOptions.file!, "..");

          for (const fileName in bundle) {
            const chunk = bundle[fileName];

            if (chunk.type === "chunk") {
              if (chunk.moduleIds.includes(renderAssetsRuntimeId)) {
                serverManifest.chunksNeedingAssets.push(
                  path.resolve(dir, fileName),
                );
              }
            }
          }

          serverManifest.ssrAssetIds = [];
          for (const moduleId of this.getModuleIds()) {
            if (moduleId.startsWith(root)) {
              const module = this.getModuleInfo(moduleId);
              if (module?.meta["vite:asset"]) {
                serverManifest.ssrAssetIds.push(
                  "." + moduleId.slice(root.length),
                );
              }
            }
          }

          if (!isBuildApp) {
            store.write(serverManifest);
          }
        } else {
          const clientManifest: ClientManifest = {};

          if (isEmpty(serverManifest.entries)) {
            for (const chunkId in bundle) {
              const chunk = bundle[chunkId];
              if (
                chunk.type === "chunk" &&
                chunk.facadeModuleId === noClientAssetsRuntimeId
              ) {
                delete bundle[chunkId];
                delete bundle[chunkId + ".map"];
              }
            }
          } else {
            for (const entryId in serverManifest.entries) {
              const fileName = serverManifest.entries[entryId];
              const chunkId = fileName + htmlExt;
              const chunk = bundle[chunkId];

              if (chunk?.type === "asset") {
                clientManifest[entryId] = {
                  ...(await generateDocManifest(
                    basePath,
                    chunk.source.toString(),
                  )),
                  preload: undefined, // clear out preload for prod builds.
                } as any;

                delete bundle[chunkId];
              } else {
                this.error(
                  `Marko template had unexpected output from vite, ${fileName}`,
                );
              }
            }

            const manifestStr = `\n;var __MARKO_MANIFEST__=${JSON.stringify(
              clientManifest,
            )};\n`;

            for (const fileName of serverManifest.chunksNeedingAssets) {
              await fs.promises.appendFile(fileName, manifestStr);
            }
          }
        }
      },
    },
  ];
}

function isMarkoFile(id: string) {
  return id.endsWith(markoExt);
}

function toHTMLEntries(root: string, serverEntries: ServerManifest["entries"]) {
  const result: string[] = [];

  for (const id in serverEntries) {
    const markoFile = normalizePath(path.join(root, serverEntries[id]));
    const htmlFile = markoFile + htmlExt;
    virtualFiles.set(htmlFile, {
      code: generateInputDoc(toClientEntryId(markoFile)),
    });
    result.push(htmlFile);
  }

  return result;
}

function getMarkoFileInfo(id: string) {
  if (id.endsWith(serverEntryExt)) {
    return {
      kind: InternalFileKind.serverEntry,
      sourceId: `${id.slice(0, -serverEntryExt.length)}${markoExt}`,
    } as const;
  }

  if (id.endsWith(clientEntryExt)) {
    return {
      kind: InternalFileKind.clientEntry,
      sourceId: `${id.slice(0, -clientEntryExt.length)}${markoExt}`,
    } as const;
  }

  const virtualMatch = virtualFileReg.exec(id);
  if (virtualMatch) {
    return {
      kind: InternalFileKind.virtual,
      sourceId: virtualMatch[1],
      virtualSuffix: virtualMatch[2],
    } as const;
  }
}

function toMarkoFileId(
  id: string,
  info: NonNullable<ReturnType<typeof getMarkoFileInfo>>,
) {
  switch (info.kind) {
    case InternalFileKind.serverEntry:
      return toServerEntryId(id);
    case InternalFileKind.clientEntry:
      return toClientEntryId(id);
    case InternalFileKind.virtual:
      return `${id}${virtualFileInfix}${info.virtualSuffix}`;
  }
}

function toServerEntryId(id: string) {
  return id.slice(0, -markoExt.length) + serverEntryExt;
}

function toClientEntryId(id: string) {
  return id.slice(0, -markoExt.length) + clientEntryExt;
}

function toEntryId(id: string) {
  const lastSepIndex = id.lastIndexOf(POSIX_SEP);
  let name = id.slice(lastSepIndex + 1, id.indexOf(".", lastSepIndex));

  if (name === "index" || name === "template") {
    name = id.slice(
      id.lastIndexOf(POSIX_SEP, lastSepIndex - 1) + 1,
      lastSepIndex,
    );
  }

  return `${name}_${crypto
    .createHash("shake256", TEMPLATE_ID_HASH_OPTS)
    .update(id)
    .digest("base64url")}`;
}

function fileNameToURL(fileName: string, root: string) {
  const relativeURL = normalizePath(path.relative(root, fileName));
  if (relativeURL[0] === ".") {
    throw new Error(
      "@marko/vite: Entry templates must exist under the current root directory.",
    );
  }

  return `/${relativeURL}`;
}

function virtualPathToCacheFile(
  virtualPath: string,
  root: string,
  cacheDir: string,
) {
  return path.join(
    cacheDir,
    normalizePath(path.relative(root, virtualPath)).replace(/[\\/?=&]+/g, "_"),
  );
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

function stripViteQueries(id: string) {
  const queryStart = id.indexOf("?");
  if (queryStart === -1) return id;
  const url = id.slice(0, queryStart);
  const query = id
    .slice(queryStart + 1)
    .replace(/(?:^|[&])(?:cache|[vt])=[^&]+/g, "");
  if (query) return `${url}?${query}`;
  return url;
}

function getKnownTemplates(cwd: string) {
  let knownTemplates = optimizeKnownTemplatesForRoot.get(cwd);
  if (!knownTemplates) {
    optimizeKnownTemplatesForRoot.set(
      cwd,
      (knownTemplates = glob.globSync(
        ["**/*.marko", "**/node_modules/.marko/**/*.marko"],
        {
          cwd,
          absolute: true,
          ignore: [
            "**/*.d.marko",
            "**/*build*/**",
            "**/*coverage*/**",
            "**/*example*/**",
            "**/*fixture*/**",
            "**/*snapshot*/**",
            "**/*stories*/**",
            "**/*test*/**",
          ],
        },
      )),
    );
  }
  return knownTemplates;
}

function stripSourceRoot(map: any) {
  if (map && map.sourceRoot) {
    // Always strip the sourceRoot path since otherwise file system information
    // is sent to the browser.
    // Without `sourceRoot` everything implicitly becomes relative to the project root.
    map.sourceRoot = undefined;
  }
  return map;
}
