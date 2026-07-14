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
import transformCjsToEsm from "./cjs-to-esm";
import globImportTransformer from "./glob-import-transform";
import {
  getDevLoadAssetsManifest,
  getLinkAssetsRuntime,
  getRegisterAssetsCode,
  linkAssetsRuntimeId,
  supportsLinkAssets,
} from "./link-assets";
import {
  type DocManifest,
  generateDocManifest,
  generateInputDoc,
  generateLinkAssetsManifest,
  type LinkAssetsDocManifest,
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
import { clearScanCache } from "./scan";
import getServerEntryTemplate from "./server-entry-template";

export namespace API {
  /**
   * @deprecated This api targets the legacy asset orchestration and will be
   * removed in a future release. Providing it opts the plugin out of the
   * Marko compiler's built-in asset orchestration (the `linkAssets` compiler
   * option).
   */
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
  loadEntry,
  virtual,
}

interface ClientManifest {
  [id: string]: DocManifest | LinkAssetsDocManifest;
}

interface ServerManifest {
  entries: {
    [entryId: string]: string;
  };
  entrySources: {
    [entryId: string]: string;
  };
  loadEntries?: {
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
const virtualFilesForTemplate = new Map<string, Set<string>>();
const virtualFilesResetForTemplate = new Map<string, number>();
const ssrTransformCache = new Map<string, string>();
const importTagReg = /^<([^>]+)>$/;
// Styles Vite's `assetsInclude` skips (it handles css/preprocessors itself).
const styleImportReg =
  /\.(?:css|less|s[ac]ss|styl(?:us)?|pcss|postcss)(?:\?|$)/i;
const optionalWatchFileReg =
  /[\\/](?:([^\\/]+)\.)?(?:marko-tag.json|(?:style|component|component-browser)\.\w+)$/;
const noClientAssetsRuntimeId = "\0no_client_bundles.mjs";
const markoExt = ".marko";
const htmlExt = ".html";
const clientEntryExt = ".client-entry.marko";
const serverEntryExt = ".server-entry.marko";
const loadEntryExt = ".load-entry.marko";
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

function noop(): undefined {}

export default function markoPlugin(opts: Options = {}): vite.Plugin[] {
  let { linked = true } = opts;
  let runtimeId: string | undefined;
  let basePathVar: string | undefined;
  let baseConfig: compiler.Config;
  let clientConfig: compiler.Config;
  let clientEntryConfig: compiler.Config;
  let clientLoadEntryConfig: compiler.Config;
  let serverConfig: compiler.Config;
  let serverCJSConfig: compiler.Config;
  let serverEntryConfig: compiler.Config;
  let serverEntryLinkConfig: compiler.Config;
  let useLinkAssets = false;
  let virtualFileCacheDirPromise: Promise<unknown> | undefined;

  const resolveVirtualDependency: compiler.Config["resolveVirtualDependency"] =
    (from, dep) => {
      const { virtualPath } = dep;
      const normalizedFrom = normalizePath(from);
      const nativeFrom = path.join(from);
      const resolvedVirtualPath = path.join(nativeFrom, "..", virtualPath);
      const virtualBaseName = path.basename(resolvedVirtualPath);
      const markoBaseName = /^.*?\.marko(?=\.)/.exec(virtualBaseName)?.[0];
      const virtualFileName = markoBaseName
        ? path.join(
            resolvedVirtualPath,
            "..",
            markoBaseName +
              virtualFileInfix +
              virtualBaseName.slice(markoBaseName.length),
          )
        : `${nativeFrom}${virtualFileInfix}.${virtualBaseName.replace(/[^a-z0-9_.-]+/gi, "_")}`;
      const id = normalizePath(virtualFileName);
      const virtualFile = {
        code: dep.code,
        map: stripSourceRoot(dep.map),
      };

      if (devServer) {
        const prev = virtualFiles.get(id);
        if (isDeferredPromise(prev)) {
          prev.resolve(virtualFile);
        }

        let files = virtualFilesForTemplate.get(normalizedFrom);
        if (!files) {
          virtualFilesForTemplate.set(normalizedFrom, (files = new Set()));
        }
        files.add(id);
      }

      virtualFiles.set(id, virtualFile);
      return relativeImportPath(nativeFrom, virtualFileName);
    };

  let root: string;
  let cacheDir: string | undefined;
  let rootResolveFile: string;

  // Warning diagnostics print once per file+source version (the html and dom
  // compiles of the same source share one print; edits reprint).
  const printedWarnings = new Map<
    string,
    { source: string; labels: Set<string> }
  >();

  // `@marko/compiler` annotates compile errors with the agent cheat-sheet
  // pointer; here we only surface warning diagnostics to the terminal.
  async function compileAndReportWarnings(
    source: string,
    filename: string,
    config: compiler.Config,
  ) {
    const result = await compiler.compile(source, filename, config);
    let printed = printedWarnings.get(filename);
    if (printed?.source !== source) {
      printedWarnings.set(filename, (printed = { source, labels: new Set() }));
    }
    for (const diag of result.meta.diagnostics) {
      if (diag.type === "warning" && !printed.labels.has(diag.label)) {
        printed.labels.add(diag.label);
        const loc = diag.loc ? `:${diag.loc.start.line}` : "";
        console.warn(
          `[marko] warning: ${path.relative(root, filename)}${loc} ${diag.label}`,
        );
      }
    }
    return result;
  }
  let devEntryFile: string;
  let devEntryFilePosix: string;
  let renderAssetsRuntimeCode: string;
  let linkAssetsRuntimeCode: string;
  // Vite's asset matcher (set in `configResolved`); excludes css, so
  // `isSideEffectFile` adds styles + `.marko`.
  let viteAssetsInclude: (file: string) => boolean = () => false;
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
  const pageAssetIds = new Map<string, string>();
  const loadAssetIds = new Map<string, string>();
  const cachedSources = new Map<string, string>();
  const transformWatchFiles = new Map<string, string[]>();
  const transformAnalyzedTags = new Map<string, Set<string>>();
  // Resolved ids of a template's explicit bare `import "x"` imports (filled in
  // `transform`); the treeshake hook keeps these, everything else is shakeable.
  const markoSideEffectImportIds = new Set<string>();
  const store = new ReadOncePersistedStore<ServerManifest>(
    `vite-marko${runtimeId ? `-${runtimeId}` : ""}`,
  );
  const isTagsApi = (api: undefined | string) => api === "tags";
  // Kept purely by path: a `.marko` file, a style, or a Vite asset.
  const isSideEffectFile = (file: string) =>
    isMarkoFile(file) || styleImportReg.test(file) || viteAssetsInclude(file);

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

        useLinkAssets = linked && supportsLinkAssets(opts.translator);

        if (useLinkAssets) {
          baseConfig.linkAssets = {
            runtime: linkAssetsRuntimeId,
            onAsset(kind, filename, assetId) {
              const file = normalizePath(filename);
              if (kind === "page") {
                pageAssetIds.set(file, assetId);
              } else if (isBuild) {
                if (serverManifest) {
                  (serverManifest.loadEntries ??= {})[assetId] = normalizePath(
                    path.relative(root, file),
                  );
                }
              } else if (devServer && !loadAssetIds.has(file)) {
                loadAssetIds.set(file, assetId);
                // The template may have already been transformed before it
                // was known to be lazily loaded. Re-transform it so its
                // compiled output includes the dev asset registration.
                const { moduleGraph } = devServer.environments.ssr;
                const mods = moduleGraph.getModulesByFile(file);
                if (mods) {
                  for (const mod of mods) {
                    moduleGraph.invalidateModule(mod);
                  }
                }
              }
            },
          };
        }

        const cjsInteropMarkoVite = {
          filter:
            isBuild || isTest ? undefined : (path: string) => !/^\./.test(path),
        };

        clientConfig = {
          ...baseConfig,
          output: "dom",
          // In build, keep the compiled AST so `transform` can read a template's
          // side effect imports for tree-shaking without re-parsing (see below).
          ast: isBuild,
        };
        clientEntryConfig = {
          ...baseConfig,
          output: "hydrate",
          sourceMaps: false,
          // Also keep the AST here so the page entry's own side effect imports
          // (eg the assets a server only page links in) are captured too.
          ast: isBuild,
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
        serverEntryLinkConfig = {
          ...serverConfig,
          entry: "page",
          sourceMaps: false,
        };
        clientLoadEntryConfig = {
          ...clientConfig,
          entry: "load",
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
        linkAssetsRuntimeCode = getLinkAssetsRuntime({
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
          config.build.rolldownOptions ??= {};
          if (!config.build.rolldownOptions.output) {
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

          if (!isSSR) {
            // Marko is the only source of side effects: default every module to
            // side effect free (kept: `.marko`, assets, and bare imports).
            const treeshake = config.build.rolldownOptions.treeshake;
            const userModuleSideEffects =
              treeshake && typeof treeshake === "object"
                ? treeshake.moduleSideEffects
                : undefined;
            // Only compose when we can defer to the user's value (a function or
            // nothing); leave an explicit array/string/"no-external" untouched.
            if (
              treeshake !== false &&
              (userModuleSideEffects == null ||
                typeof userModuleSideEffects === "function")
            ) {
              config.build.rolldownOptions.treeshake = {
                ...(typeof treeshake === "object" ? treeshake : undefined),
                moduleSideEffects: (id, external) => {
                  const userValue = userModuleSideEffects?.(id, external);
                  if (userValue != null) return userValue;
                  // Let vite handle externals as it normally would.
                  if (external) return undefined;
                  return markoSideEffectImportIds.has(id) ||
                    isSideEffectFile(stripViteQueries(id))
                    ? undefined
                    : false;
                },
              };
            }
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
        viteAssetsInclude = config.assetsInclude;
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

        if (getMarkoAssetFns && useLinkAssets) {
          // TODO: remove once the deprecated `getMarkoAssetCodeForEntry` api
          // is dropped. Its entries target the legacy asset runtime, so any
          // plugin providing it opts the build out of the compiler's
          // built-in asset orchestration.
          useLinkAssets = false;
          for (const compileConfig of [
            baseConfig,
            clientConfig,
            clientEntryConfig,
            clientLoadEntryConfig,
            serverConfig,
            serverCJSConfig,
            serverEntryConfig,
            serverEntryLinkConfig,
          ]) {
            delete compileConfig.linkAssets;
          }

          compiler.configure(baseConfig);
        }
      },
      configureServer(_server) {
        if (!isTest) {
          clientConfig.hot =
            serverConfig.hot =
            serverEntryConfig.hot =
            serverEntryLinkConfig.hot =
              true;
        }

        devServer = _server;
        devServer.watcher.on("all", (type, originalFileName) => {
          const fileName = normalizePath(originalFileName);
          cachedSources.delete(fileName);

          if (type === "unlink") {
            entryIds.delete(fileName);
            transformWatchFiles.delete(fileName);
            transformAnalyzedTags.delete(fileName);
            virtualFilesForTemplate.delete(fileName);
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

      async hotUpdate(ctx) {
        compiler.taglib.clearCaches();
        baseConfig.cache!.clear();
        clearScanCache();

        const modules = new Set(ctx.modules);
        const fileName = normalizePath(ctx.file);

        // When a child tag template changes, parent templates that analyzed
        // it may need recompilation (e.g., input destructuring changes in
        // Tags API affect the parent's compiled output).
        for (const [parent, files] of transformAnalyzedTags) {
          if (files.has(fileName)) {
            const mods = this.environment.moduleGraph.getModulesByFile(parent);
            if (mods) {
              for (const mod of mods) {
                modules.add(mod);
              }
            }
          }
        }

        // When a .marko file changes, its virtual dependencies (e.g.,
        // extracted CSS from style {} blocks) also need to be included
        // in the HMR update so the browser receives the new content.
        const virtualFileIds = virtualFilesForTemplate.get(fileName);
        if (virtualFileIds) {
          // This hook runs once per environment for the same file change. A
          // compile triggered by one environment can resolve the pending
          // virtual files before another environment's hook runs, so the
          // pending state is only reset once per change — resetting again
          // would leave a promise nothing recompiles to resolve.
          const shouldReset =
            virtualFilesResetForTemplate.get(fileName) !== ctx.timestamp;
          if (shouldReset) {
            virtualFilesResetForTemplate.set(fileName, ctx.timestamp);
          }

          for (const id of virtualFileIds) {
            if (shouldReset && !isDeferredPromise(virtualFiles.get(id))) {
              virtualFiles.set(id, createDeferredPromise());
            }
            const mods = this.environment.moduleGraph.getModulesByFile(id);
            if (mods) {
              for (const mod of mods) {
                this.environment.moduleGraph.invalidateModule(mod);
                modules.add(mod);
              }
            }
          }
        }

        if (linked && this.environment.name === "ssr") {
          const previous = new Map<vite.EnvironmentModuleNode, string>();

          for (const mod of modules) {
            const code = ssrTransformCache.get(mod.id!);
            if (code !== undefined) {
              previous.set(mod, code);
            }
          }

          if (previous.size) {
            let reload = false;
            for (const [mod, prevCode] of previous) {
              await this.environment.transformRequest(mod.id!);
              if (
                prevCode !== ssrTransformCache.get(mod.id!) &&
                !devServer.environments.client.moduleGraph.getModulesByFile(
                  mod.id!,
                )
              ) {
                reload = true;
              }
            }

            if (reload) {
              devServer.hot.send({ type: "full-reload" });
            }
          }
        }

        if (modules.size !== ctx.modules.length) {
          return [...modules];
        }
      },

      async options(inputOptions) {
        if (isBuild && this.environment.name !== "ssr") {
          // Reset the per-build tree-shaking set (eg for `vite build --watch`).
          markoSideEffectImportIds.clear();
        }

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
              const htmlInputs = toHTMLEntries(root, serverManifest.entries);
              if (serverManifest.loadEntries) {
                for (const entryId in serverManifest.loadEntries) {
                  htmlInputs.push(
                    toLoadHTMLEntry(root, serverManifest.loadEntries[entryId]),
                  );
                }
              }

              if (htmlInputs.length === 0) {
                inputOptions.input = noClientAssetsRuntimeId;
              } else {
                inputOptions.input = htmlInputs;
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
        // An explicit bare `import "x"` only says *x* has side effects, but x's
        // own side effects usually live in the modules it imports (eg terser
        // installs `AST_Toplevel#resolve_defines` from a bare
        // `import "./global-defs.js"`). Carry the marking downstream so the
        // whole subgraph a template opted into keeps its side effects. This
        // stops at `.marko`/style/asset ids, which are never added to the set,
        // so a template's own imports stay shakeable.
        if (
          isBuild &&
          !ssr &&
          importer &&
          markoSideEffectImportIds.has(importer)
        ) {
          const resolved = await this.resolve(importee, importer, {
            ...importOpts,
            skipSelf: true,
          });

          if (
            resolved &&
            !resolved.external &&
            !isSideEffectFile(stripViteQueries(resolved.id))
          ) {
            markoSideEffectImportIds.add(resolved.id);
          }
        }

        switch (importee) {
          case cjsInteropHelpersId:
          case renderAssetsRuntimeId:
          case linkAssetsRuntimeId:
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
          case linkAssetsRuntimeId:
            return linkAssetsRuntimeCode;
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
            case InternalFileKind.clientEntry:
            case InternalFileKind.loadEntry: {
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
        const id = stripViteQueries(rawId);
        const info = getMarkoFileInfo(id);
        const isSSR = this.environment.name === "ssr";
        const isClientEntry = info?.kind === InternalFileKind.clientEntry;
        const isServerEntry = info?.kind === InternalFileKind.serverEntry;
        const isLoadEntry = info?.kind === InternalFileKind.loadEntry;

        if (isServerEntry && !useLinkAssets) {
          // TODO: remove this branch once the legacy (pre `linkAssets`
          // compiler option) asset orchestration is dropped.
          const fileName = info.sourceId;
          let mainEntryData: string;
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

          let markoAPI: string | undefined;
          if ("transformRequest" in this.environment) {
            const entryMod =
              this.environment.moduleGraph.getModuleById(fileName);
            await this.environment.transformRequest(fileName);
            markoAPI = this.getModuleInfo(fileName)?.meta.markoAPI;
            // transformRequest above re-populates the module's transformResult
            // which prevents the SSR module runner from detecting that it was
            // invalidated. Re-invalidate so the runner properly re-evaluates it.

            if (entryMod) {
              this.environment.moduleGraph.invalidateModule(entryMod);
            }
          } else {
            markoAPI = (await this.load({ id: fileName }))?.meta.markoAPI;
          }

          source = await getServerEntryTemplate({
            fileName,
            entryData,
            runtimeId,
            basePathVar: isBuild ? basePathVar : undefined,
            tagsAPI: isTagsApi(markoAPI),
          });
        }

        if (!isMarkoFile(id)) {
          if (!isBuild && isSSR) {
            const ext = path.extname(id);
            if (
              ext === ".cjs" ||
              (ext === ".js" && isCJSModule(id, rootResolveFile))
            ) {
              try {
                return await transformCjsToEsm(source, id);
              } catch {
                return null;
              }
            }
          }

          return null;
        }

        const fileName =
          isClientEntry || isLoadEntry || (isServerEntry && useLinkAssets)
            ? info.sourceId
            : id;

        if (isServerEntry && useLinkAssets) {
          cachedSources.set(fileName, source);
        }

        if (isSSR) {
          if (linked) {
            cachedSources.set(id, source);
          }

          if (!info && isCJSModule(id, rootResolveFile)) {
            if (isBuild) {
              const { code, map, meta } = await compileAndReportWarnings(
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

        const compiled = await compileAndReportWarnings(
          source,
          fileName,
          isSSR
            ? isCJSModule(id, rootResolveFile)
              ? serverCJSConfig
              : isServerEntry
                ? useLinkAssets
                  ? serverEntryLinkConfig
                  : serverEntryConfig
                : serverConfig
            : isClientEntry
              ? clientEntryConfig
              : isLoadEntry
                ? clientLoadEntryConfig
                : clientConfig,
        );

        const { meta } = compiled;
        let { code } = compiled;

        if (isBuild && !isSSR && compiled.ast) {
          // Record every bare `import "x"` the template compiles to so the
          // treeshake hook keeps it (externals are left for vite to handle).
          // Files `isSideEffectFile` already keeps (`.marko`, styles, assets)
          // are skipped: adding them would seed the propagation below with, eg,
          // every page template, which would mark the entire client graph.
          let resolvingSideEffectImports: Promise<unknown>[] | undefined;
          for (const node of compiled.ast.program.body) {
            if (
              node.type === "ImportDeclaration" &&
              node.specifiers.length === 0
            ) {
              (resolvingSideEffectImports ??= []).push(
                this.resolve(node.source.value, fileName, resolveOpts).then(
                  (resolved) => {
                    if (
                      resolved &&
                      !resolved.external &&
                      !isSideEffectFile(stripViteQueries(resolved.id))
                    ) {
                      markoSideEffectImportIds.add(resolved.id);
                    }
                  },
                ),
              );
            }
          }
          if (resolvingSideEffectImports) {
            await Promise.all(resolvingSideEffectImports);
          }
        }

        if (isServerEntry && useLinkAssets) {
          // With the compiler's built-in asset orchestration the compiler
          // generates the server entry wrapper itself and reports the page
          // asset id through `linkAssets.onAsset` during the compile above.
          const assetId = pageAssetIds.get(normalizePath(fileName));

          if (!assetId) {
            return this.error(
              `@marko/vite: the Marko compiler did not report an asset id for ${fileName}.`,
            );
          }

          if (isBuild) {
            const relativeFileName = normalizePath(
              path.relative(root, fileName),
            );
            serverManifest!.entries[assetId] = relativeFileName;
            serverManifest!.entrySources[relativeFileName] = source;
          } else {
            code += getRegisterAssetsCode(
              assetId,
              JSON.stringify(
                await generateLinkAssetsManifest(
                  basePath,
                  await devServer.transformIndexHtml(
                    "/",
                    generateInputDoc(
                      fileNameToURL(toClientEntryId(fileName), root),
                    ),
                  ),
                  assetId,
                ),
              ),
            );
          }
        }

        if (isSSR && devServer && useLinkAssets && !info) {
          // In dev, a lazily loaded (`import ... with { load }`) template
          // registers its asset manifest as part of its own compiled output.
          // The importing page always imports it on the server before
          // rendering, so the registration runs before assets can flush.
          const loadAssetId = loadAssetIds.get(normalizePath(fileName));
          if (loadAssetId) {
            code += getRegisterAssetsCode(
              loadAssetId,
              JSON.stringify(
                getDevLoadAssetsManifest(
                  fileNameToURL(toLoadEntryId(fileName), root).slice(1),
                ),
              ),
            );
          }
        }

        if (serverManifest && isClientEntry) {
          for (const assetId of serverManifest.ssrAssetIds) {
            code += `\nimport "${relativeImportPath(id, path.resolve(root, assetId))}";`;
          }
        }

        if (!isTest && devServer && !isTagsApi(meta.api)) {
          code += `\nif (import.meta.hot) import.meta.hot.accept(() => {});`;
        }

        if (devServer) {
          if (isSSR && !isServerEntry) {
            ssrTransformCache.set(id, code);
          }
          if (!info) {
            transformWatchFiles.set(id, meta.watchFiles);
          }
          if (meta.analyzedTags) {
            const files = new Set<string>();
            transformAnalyzedTags.set(id, files);
            if (isClientEntry || (isServerEntry && useLinkAssets)) {
              files.add(normalizePath(info.sourceId));
            }
            for (const file of meta.analyzedTags) {
              files.add(normalizePath(file));
            }
          }
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
              if (
                chunk.moduleIds.includes(
                  useLinkAssets ? linkAssetsRuntimeId : renderAssetsRuntimeId,
                )
              ) {
                serverManifest.chunksNeedingAssets.push(
                  path.resolve(dir, fileName),
                );
              }
            }
          }

          if (serverManifest.loadEntries) {
            // Cache lazily loaded entry sources so the browser build can
            // compile them without reading from disk (supporting virtual
            // Marko files).
            for (const entryId in serverManifest.loadEntries) {
              const relativeFileName = serverManifest.loadEntries[entryId];
              if (!serverManifest.entrySources[relativeFileName]) {
                const source = cachedSources.get(
                  normalizePath(path.join(root, relativeFileName)),
                );
                if (source) {
                  serverManifest.entrySources[relativeFileName] = source;
                }
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

          if (
            isEmpty(serverManifest.entries) &&
            isEmpty(serverManifest.loadEntries)
          ) {
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
                clientManifest[entryId] = useLinkAssets
                  ? await generateLinkAssetsManifest(
                      basePath,
                      chunk.source.toString(),
                    )
                  : ({
                      ...(await generateDocManifest(
                        basePath,
                        chunk.source.toString(),
                      )),
                      preload: undefined, // clear out preload for prod builds.
                    } as any);

                delete bundle[chunkId];
              } else {
                this.error(
                  `Marko template had unexpected output from vite, ${fileName}`,
                );
              }
            }

            if (serverManifest.loadEntries) {
              for (const entryId in serverManifest.loadEntries) {
                const fileName = serverManifest.loadEntries[entryId];
                const chunkId =
                  fileName.slice(0, -markoExt.length) + loadEntryExt + htmlExt;
                const chunk = bundle[chunkId];

                if (chunk?.type === "asset") {
                  // Vite only writes stylesheet links into the html document
                  // for statically imported css, but a load entry's component
                  // code sits behind a dynamic import and hydrates html that
                  // was already server rendered. Any css reachable from the
                  // load entry must flush with that html to avoid FOUC, so
                  // it's injected into the document before partitioning
                  // (making it part of the render blocking group).
                  let html = chunk.source.toString();
                  let cssLinks = "";
                  for (const cssFileName of collectCssFiles(
                    bundle,
                    normalizePath(path.join(root, chunkId)),
                  )) {
                    cssLinks += `<link rel="stylesheet" href=${JSON.stringify(
                      basePath + cssFileName,
                    )}>`;
                  }
                  if (cssLinks) {
                    html = html.replace("</head>", `${cssLinks}</head>`);
                  }

                  clientManifest[entryId] = await generateLinkAssetsManifest(
                    basePath,
                    html,
                  );

                  delete bundle[chunkId];
                } else {
                  this.error(
                    `Marko template had unexpected output from vite, ${fileName}`,
                  );
                }
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

/**
 * Collects the css output files reachable from the chunk for the given
 * module id, following both static and dynamic imports.
 */
function collectCssFiles(
  bundle: vite.Rollup.OutputBundle,
  facadeModuleId: string,
) {
  const css = new Set<string>();

  for (const fileName in bundle) {
    const chunk = bundle[fileName];
    if (chunk.type === "chunk" && chunk.facadeModuleId === facadeModuleId) {
      const seen = new Set<string>();
      const visit = (chunkFileName: string) => {
        if (seen.has(chunkFileName)) return;
        seen.add(chunkFileName);
        const chunk = bundle[chunkFileName];
        if (chunk?.type === "chunk") {
          if (chunk.viteMetadata) {
            for (const cssFileName of chunk.viteMetadata.importedCss) {
              css.add(cssFileName);
            }
          }
          for (const imported of chunk.imports) visit(imported);
          for (const imported of chunk.dynamicImports) visit(imported);
        }
      };
      visit(chunk.fileName);
      break;
    }
  }

  return css;
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

function toLoadHTMLEntry(root: string, relativeFileName: string) {
  const loadFile = toLoadEntryId(
    normalizePath(path.join(root, relativeFileName)),
  );
  const htmlFile = loadFile + htmlExt;
  virtualFiles.set(htmlFile, {
    code: generateInputDoc(loadFile),
  });
  return htmlFile;
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

  if (id.endsWith(loadEntryExt)) {
    return {
      kind: InternalFileKind.loadEntry,
      sourceId: `${id.slice(0, -loadEntryExt.length)}${markoExt}`,
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
    case InternalFileKind.loadEntry:
      return toLoadEntryId(id);
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

function toLoadEntryId(id: string) {
  return id.slice(0, -markoExt.length) + loadEntryExt;
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
