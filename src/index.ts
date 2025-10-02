import type { PluginObj } from "@babel/core";
import * as compiler from "@marko/compiler";
import anyMatch from "anymatch";
import crypto from "crypto";
import glob from "fast-glob";
import fs from "fs";
import { createRequire } from "module";
import path from "path";
import type * as vite from "vite";

import interopBabelPlugin from "./babel-plugin-cjs-interop";
import esbuildPlugin from "./esbuild-plugin";
import globImportTransformer from "./glob-import-transform";
import {
  type DocManifest,
  generateDocManifest,
  generateInputDoc,
} from "./manifest-generator";
import { ReadOncePersistedStore } from "./read-once-persisted-store";
import relativeAssetsTransform from "./relative-assets-transform";
import {
  getRenderAssetsRuntime,
  renderAssetsRuntimeId,
} from "./render-assets-runtime";
import renderAssetsTransform from "./render-assets-transform";
import { isCJSModule } from "./resolve";
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

const POSIX_SEP = "/";
const WINDOWS_SEP = "\\";
const TEMPLATE_ID_HASH_OPTS = { outputLength: 3 };

const normalizePath =
  path.sep === WINDOWS_SEP
    ? (id: string) => id.replace(/\\/g, POSIX_SEP)
    : (id: string) => id;
const virtualFiles = new Map<
  string,
  VirtualFile | DeferredPromise<VirtualFile>
>();
const extReg = /\.[^.]+$/;
const queryReg = /\?marko-[^?]+$/;
const importTagReg = /^<([^>]+)>$/;
const noClientAssetsRuntimeId = "\0no_client_bundles.mjs";
const browserEntryQuery = "?marko-browser-entry";
const serverEntryQuery = "?marko-server-entry";
const virtualFileQuery = "?marko-virtual";
const browserQuery = "?marko-browser";
const markoExt = ".marko";
const htmlExt = ".html";
const resolveOpts = { skipSelf: true };
const configsByFileSystem = new Map<
  typeof fs,
  Map<compiler.Config, compiler.Config>
>();
const cache = new Map<unknown, unknown>();
const babelCaller = {
  name: "@marko/vite",
  supportsStaticESM: true,
  supportsDynamicImport: true,
  supportsTopLevelAwait: true,
  supportsExportNamespaceFrom: true,
};
const optimizeKnownTemplatesForRoot = new Map<string, string[]>();
let registeredTagLib = false;

// This package has a dependency on @parcel/source-map which uses native addons.
// Some environments like Stackblitz don't support loading these. So... load it
// with a dynamic import to avoid everything failing.
let cjsToEsm: typeof import("@chialab/cjs-to-esm").transform | null | undefined;

function noop() {}

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  let { linked = true } = opts;
  let runtimeId: string | undefined;
  let basePathVar: string | undefined;
  let baseConfig: compiler.Config;
  let ssrConfig: compiler.Config;
  let ssrCjsConfig: compiler.Config;
  let domConfig: compiler.Config;
  let hydrateConfig: compiler.Config;

  const resolveVirtualDependency: compiler.Config["resolveVirtualDependency"] =
    (from, dep) => {
      const normalizedFrom = normalizePath(from);
      const query = `${virtualFileQuery}&id=${encodeURIComponent(dep.virtualPath)}`;
      const id = normalizedFrom + query;

      if (devServer) {
        const prev = virtualFiles.get(id);
        if (isDeferredPromise(prev)) {
          prev.resolve(dep);
        }
      }

      virtualFiles.set(id, dep);
      return `./${path.posix.basename(normalizedFrom) + query}`;
    };

  let root: string;
  let rootResolveFile: string;
  let devEntryFile: string;
  let devEntryFilePosix: string;
  let renderAssetsRuntimeCode: string;
  let isTest = false;
  let isBuild = false;
  let isSSRBuild = false;
  let devServer: vite.ViteDevServer;
  let serverManifest: ServerManifest | undefined;
  let basePath = "/";
  let getMarkoAssetFns: undefined | API.getMarkoAssetCodeForEntry[];
  let checkIsEntry: NonNullable<Options["isEntry"]> = () => true;

  const entryIds = new Set<string>();
  const cachedSources = new Map<string, string>();
  const transformWatchFiles = new Map<string, string[]>();
  const transformOptionalFiles = new Map<string, string[]>();
  const store = new ReadOncePersistedStore<ServerManifest>(
    `vite-marko${runtimeId ? `-${runtimeId}` : ""}`,
  );

  const isTagsApi = (() => {
    let tagsAPI: undefined | boolean;
    return () => {
      if (tagsAPI === undefined) {
        const translatorPackage =
          opts.translator ||
          compiler.globalConfig?.translator ||
          "marko/translator";
        if (
          /^@marko\/translator-(?:default|interop-class-tags)$/.test(
            translatorPackage,
          )
        ) {
          tagsAPI = false;
        } else {
          try {
            const require = createRequire(import.meta.url);
            tagsAPI = require(translatorPackage).preferAPI !== "class";
          } catch {
            tagsAPI = true;
          }
        }
      }

      return tagsAPI;
    };
  })();

  return [
    {
      name: "marko-vite:pre",
      enforce: "pre", // Must be pre to allow us to resolve assets before vite.
      async config(config, env) {
        let optimize = env.mode === "production";
        isTest = env.mode === "test";
        isBuild = env.command === "build";

        if (isTest) {
          linked = false;
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
        if (opts.isEntry) {
          checkIsEntry = opts.isEntry;
        }

        if ("BASE_URL" in process.env && config.base == null) {
          config.base = process.env.BASE_URL;
        }

        root = normalizePath(config.root || process.cwd());
        rootResolveFile = path.join(root, "_.js");
        baseConfig = {
          cache,
          optimize,
          runtimeId,
          sourceMaps: true,
          writeVersionComment: false,
          resolveVirtualDependency,
          optimizeKnownTemplates:
            optimize && linked ? getKnownTemplates(root) : undefined,
          babelConfig: opts.babelConfig
            ? {
                ...opts.babelConfig,
                caller: opts.babelConfig.caller
                  ? {
                      name: "@marko/vite",
                      supportsStaticESM: true,
                      supportsDynamicImport: true,
                      supportsTopLevelAwait: true,
                      supportsExportNamespaceFrom: true,
                      ...opts.babelConfig.caller,
                    }
                  : babelCaller,
              }
            : {
                babelrc: false,
                configFile: false,
                browserslistConfigFile: false,
                caller: babelCaller,
              },
        };

        if (linked) {
          (baseConfig as any).markoViteLinked = linked;
        }

        const getCJSInteropBabelConfig = () => ({
          ...baseConfig.babelConfig,
          plugins: (
            (baseConfig.babelConfig!.plugins || []) as (
              | PluginObj<any>
              | string
            )[]
          ).concat(
            interopBabelPlugin({
              filter:
                isBuild || isTest ? undefined : (path) => !/^\./.test(path),
            }),
          ),
        });

        ssrConfig = {
          ...baseConfig,
          output: "html",
        };

        ssrCjsConfig = {
          ...ssrConfig,
          babelConfig: getCJSInteropBabelConfig(),
        };

        domConfig = {
          ...baseConfig,
          output: "dom",
        };

        if (isTest) {
          domConfig.babelConfig = getCJSInteropBabelConfig();
        }

        hydrateConfig = {
          ...baseConfig,
          output: "hydrate",
        };

        compiler.configure(baseConfig);
        devEntryFile = path.join(root, "index.html");
        devEntryFilePosix = normalizePath(devEntryFile);
        isSSRBuild = isBuild && linked && Boolean(config.build!.ssr);
        renderAssetsRuntimeCode = getRenderAssetsRuntime({
          isBuild,
          basePathVar,
          runtimeId,
        });

        if (isTest) {
          const { test } = config as any;

          if ((test.environment as string | undefined)?.includes("dom")) {
            config.resolve ??= {};
            config.resolve.conditions ??= [];
            config.resolve.conditions.push("browser");
            test.deps ??= {};
            test.deps.optimizer ??= {};
            test.deps.optimizer.web ??= {};
            test.deps.optimizer.web.enabled ??= true;
          }
        }

        if (!registeredTagLib) {
          registeredTagLib = true;
          compiler.taglib.register("@marko/vite", {
            transform: globImportTransformer,
            "<head>": { transformer: renderAssetsTransform },
            "<body>": { transformer: renderAssetsTransform },
            "<*>": { transformer: relativeAssetsTransform },
          });
        }

        const optimizeDeps = (config.optimizeDeps ??= {});
        if (!isTest) {
          optimizeDeps.entries ??= [
            "**/*.marko",
            "!**/__snapshots__/**",
            `!**/__tests__/**`,
            `!**/coverage/**`,
          ];
        }

        const domDeps = compiler.getRuntimeEntryFiles("dom", opts.translator);
        optimizeDeps.include = optimizeDeps.include
          ? [...optimizeDeps.include, ...domDeps]
          : domDeps;

        const optimizeExtensions = (optimizeDeps.extensions ??= []);
        optimizeExtensions.push(".marko");

        const esbuildOptions = (optimizeDeps.esbuildOptions ??= {});
        const esbuildPlugins = (esbuildOptions.plugins ??= []);
        esbuildPlugins.push(esbuildPlugin(baseConfig));

        const ssr = (config.ssr ??= {});
        const { noExternal } = ssr;
        if (noExternal !== true) {
          const noExternalReg = /\.marko$/;
          if (noExternal) {
            if (Array.isArray(noExternal)) {
              ssr.noExternal = [...noExternal, noExternalReg];
            } else {
              ssr.noExternal = [noExternal, noExternalReg];
            }
          } else {
            ssr.noExternal = noExternalReg;
          }
        }

        if (isSSRBuild && !config.build?.rollupOptions?.output) {
          // For the server build vite will still output code split chunks to the `assets` directory by default.
          // this is problematic since you might have server assets in your client assets folder.
          // Here we change the default chunkFileNames config to instead output to the outDir directly.
          config.build ??= {};
          config.build.rollupOptions ??= {};
          config.build.rollupOptions.output = {
            chunkFileNames: `[name]-[hash].js`,
          };
        }

        if (isSSRBuild && !config.build?.commonjsOptions?.esmExternals) {
          // Rollup rewrites `require` calls to default imports for commonjs dependencies; however, if the
          // dependency is inlined, its require calls which were assumed to be commonjs are also rewritten but
          // now resolve from an ESM context and the default import is no longer safe due to conditional exports.
          // This tells Rollup which dependencies are ESM so it uses a namespace import instead.
          config.build ??= {};
          config.build.commonjsOptions ??= {};
          config.build.commonjsOptions.esmExternals = (id) =>
            !isCJSModule(id, rootResolveFile);
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
      configResolved(config) {
        basePath = config.base;
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
        ssrConfig.hot = ssrCjsConfig.hot = domConfig.hot = true;
        devServer = _server;
        devServer.watcher.on("all", (type, originalFileName) => {
          const fileName = normalizePath(originalFileName);
          cachedSources.delete(fileName);

          if (type === "unlink") {
            entryIds.delete(fileName);
            transformWatchFiles.delete(fileName);
            transformOptionalFiles.delete(fileName);
          }

          for (const [id, files] of transformWatchFiles) {
            if (anyMatch(files, fileName)) {
              devServer.watcher.emit("change", id);
            }
          }

          if (type === "add" || type === "unlink") {
            for (const [id, files] of transformOptionalFiles) {
              if (anyMatch(files, fileName)) {
                devServer.watcher.emit("change", id);
              }
            }
          }
        });
      },

      handleHotUpdate(ctx) {
        compiler.taglib.clearCaches();
        baseConfig.cache!.clear();
        optimizeKnownTemplatesForRoot.clear();

        for (const [, cache] of configsByFileSystem) {
          cache.clear();
        }

        for (const mod of ctx.modules) {
          if (mod.id && virtualFiles.has(mod.id)) {
            virtualFiles.set(mod.id, createDeferredPromise());
          }
        }
      },

      async options(inputOptions) {
        if (linked && isBuild) {
          if (isSSRBuild) {
            serverManifest = {
              entries: {},
              entrySources: {},
              chunksNeedingAssets: [],
              ssrAssetIds: [],
            };
          } else {
            try {
              serverManifest = await store.read();
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
            } catch (err) {
              this.error(
                `You must run the "ssr" build before the "browser" build.`,
              );
            }
          }
        }
      },
      async buildStart() {
        if (isBuild && linked && !isSSRBuild) {
          for (const assetId of serverManifest!.ssrAssetIds) {
            this.load({
              id: normalizePath(path.resolve(root, assetId)),
              resolveDependencies: false,
            }).catch(noop);
          }
        }
      },
      async resolveId(importee, importer, importOpts, ssr = importOpts.ssr) {
        if (virtualFiles.has(importee)) {
          return importee;
        }

        if (
          importee === renderAssetsRuntimeId ||
          importee === noClientAssetsRuntimeId
        ) {
          return { id: importee };
        }

        if (importer) {
          const tagName = importTagReg.exec(importee)?.[1];
          if (tagName) {
            const tagDef = compiler.taglib
              .buildLookup(path.dirname(importer))
              .getTag(tagName);
            return tagDef && (tagDef.template || tagDef.renderer);
          }
        }

        let importeeQuery = getMarkoQuery(importee);

        if (importeeQuery) {
          importee = importee.slice(0, -importeeQuery.length);
        } else if (!(importOpts as any).scan) {
          if (
            ssr &&
            linked &&
            importer &&
            importer[0] !== "\0" &&
            (importer !== devEntryFile ||
              normalizePath(importer) !== devEntryFilePosix) && // Vite tries to resolve against an `index.html` in some cases, we ignore it here.
            isMarkoFile(importee) &&
            !queryReg.test(importer) &&
            !isMarkoFile(importer) &&
            checkIsEntry(
              normalizePath(path.resolve(importer, "..", importee)),
              importer,
            )
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
          } else if (
            !isBuild &&
            linked &&
            !ssr &&
            !importeeQuery &&
            isMarkoFile(importee)
          ) {
            importeeQuery = browserQuery;
          }
        }

        if (importeeQuery) {
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
        const id = stripVersionAndTimeStamp(rawId);

        if (id === renderAssetsRuntimeId) {
          return renderAssetsRuntimeCode;
        }

        if (id === noClientAssetsRuntimeId) {
          return "NO_CLIENT_ASSETS";
        }

        const query = getMarkoQuery(id);
        switch (query) {
          case serverEntryQuery: {
            entryIds.add(id.slice(0, -query.length));
            return null;
          }
          case browserEntryQuery:
          case browserQuery: {
            // The goal below is to cached source content when in linked mode
            // to avoid loading from disk for both server and browser builds.
            // This is to support virtual Marko entry files.
            return cachedSources.get(id.slice(0, -query.length)) || null;
          }
        }

        return virtualFiles.get(id) || null;
      },
      async transform(source, rawId, ssr) {
        let id = stripVersionAndTimeStamp(rawId);
        const info = isBuild ? this.getModuleInfo(id) : undefined;
        const arcSourceId = info?.meta.arcSourceId;
        if (arcSourceId) {
          const arcFlagSet = info.meta.arcFlagSet;
          id = arcFlagSet
            ? arcSourceId.replace(extReg, `[${arcFlagSet.join("+")}]$&`)
            : arcSourceId;
        }

        const isSSR = typeof ssr === "object" ? ssr.ssr : ssr;
        const query = getMarkoQuery(id);

        if (query && !query.startsWith(virtualFileQuery)) {
          id = id.slice(0, -query.length);

          if (query === serverEntryQuery) {
            const fileName = id;
            let mainEntryData: string;
            id = `${id.slice(0, -markoExt.length)}.entry.marko`;
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
                      fileNameToURL(fileName, root) + browserEntryQuery,
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
              tagsAPI: isTagsApi(),
            });
          }
        }

        if (!isMarkoFile(id)) {
          if (!isBuild) {
            const ext = path.extname(id);
            if (
              ext === ".cjs" ||
              (ext === ".js" && isCJSModule(id, rootResolveFile))
            ) {
              if (cjsToEsm === undefined) {
                try {
                  cjsToEsm = (await import("@chialab/cjs-to-esm")).transform;
                } catch {
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

          if (!query && isCJSModule(id, rootResolveFile)) {
            if (isBuild) {
              const { code, map, meta } = await compiler.compile(
                source,
                id,
                getConfigForFileSystem(info, ssrCjsConfig),
              );

              return {
                code,
                map,
                meta: { arcSourceCode: source, arcScanIds: meta.analyzedTags },
              };
            }
          }
        }

        const compiled = await compiler.compile(
          source,
          id,
          getConfigForFileSystem(
            info,
            isSSR
              ? isCJSModule(id, rootResolveFile)
                ? ssrCjsConfig
                : ssrConfig
              : query === browserEntryQuery
                ? hydrateConfig
                : domConfig,
          ),
        );

        const { map, meta } = compiled;
        let { code } = compiled;

        if (query !== browserEntryQuery && devServer && !isTagsApi()) {
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
        return {
          code,
          map,
          meta: isBuild
            ? { arcSourceCode: source, arcScanIds: meta.analyzedTags }
            : undefined,
        };
      },
    },
    {
      name: "marko-vite:post",
      apply: "build",
      enforce: "post", // We use a "post" plugin to allow us to read the final generated `.html` from vite.
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
        if (!linked) {
          return;
        }

        if (!isWrite) {
          this.error(
            `Linked builds are currently only supported when in "write" mode.`,
          );
        }

        if (isSSRBuild) {
          const dir = outputOptions.dir
            ? path.resolve(outputOptions.dir)
            : path.resolve(outputOptions.file!, "..");

          for (const fileName in bundle) {
            const chunk = bundle[fileName];

            if (chunk.type === "chunk") {
              if (chunk.moduleIds.includes(renderAssetsRuntimeId)) {
                serverManifest!.chunksNeedingAssets.push(
                  path.resolve(dir, fileName),
                );
              }
            }
          }

          serverManifest!.ssrAssetIds = [];
          for (const moduleId of this.getModuleIds()) {
            if (moduleId.startsWith(root)) {
              const module = this.getModuleInfo(moduleId);
              if (module?.meta["vite:asset"]) {
                serverManifest!.ssrAssetIds.push(
                  "." + moduleId.slice(root.length),
                );
              }
            }
          }

          store.write(serverManifest!);
        } else {
          const browserManifest: BrowserManifest = {};

          if (isEmpty(serverManifest!.entries)) {
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
            for (const entryId in serverManifest!.entries) {
              const fileName = serverManifest!.entries[entryId];
              const chunkId = fileName + htmlExt;
              const chunk = bundle[chunkId];

              if (chunk?.type === "asset") {
                browserManifest[entryId] = {
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

            const manifestStr = `;var __MARKO_MANIFEST__=${JSON.stringify(
              browserManifest,
            )};\n`;

            for (const fileName of serverManifest!.chunksNeedingAssets) {
              await fs.promises.appendFile(fileName, manifestStr);
            }
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
    const markoFile = normalizePath(path.join(root, serverEntries[id]));
    const htmlFile = markoFile + htmlExt;
    virtualFiles.set(htmlFile, {
      code: generateInputDoc(markoFile + browserEntryQuery),
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

function stripVersionAndTimeStamp(id: string) {
  const queryStart = id.indexOf("?");
  if (queryStart === -1) return id;
  const url = id.slice(0, queryStart);
  const query = id.slice(queryStart + 1).replace(/(?:^|[&])[vt]=[^&]+/g, "");
  if (query) return `${url}?${query}`;
  return url;
}

/**
 * For integration with arc-vite.
 * We create a unique Marko config tied to each arcFileSystem.
 */
function getConfigForFileSystem(
  info: vite.Rollup.ModuleInfo | undefined | null,
  config: compiler.Config,
) {
  const fileSystem = info?.meta.arcFS;
  if (!fileSystem) return config;

  let configsForFileSystem = configsByFileSystem.get(fileSystem);
  if (!configsForFileSystem) {
    configsForFileSystem = new Map();
    configsByFileSystem.set(fileSystem, configsForFileSystem);
  }

  let configForFileSystem = configsForFileSystem.get(config);
  if (!configForFileSystem) {
    configForFileSystem = {
      ...config,
      fileSystem,
      cache: configsForFileSystem,
    };
    configsForFileSystem.set(config, configForFileSystem);
  }

  return configForFileSystem;
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
            "**/*dist*/**",
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
