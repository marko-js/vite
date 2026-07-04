import * as compiler from "@marko/compiler";
import path from "path";
import type { Rolldown } from "vite";

import { normalizePath } from "./normalize-path";
import { scan } from "./scan";

const virtualFileReg = /\.marko-virtual\./;
const nodeModulesReg = /[\\/]node_modules[\\/]/;

export default function rolldownPlugin(
  config: compiler.Config,
  virtualFiles: Map<string, { code: string } | Promise<{ code: string }>>,
  cacheVirtualFile: (path: string) => Promise<undefined | string>,
): Rolldown.Plugin[] {
  const baseConfig: compiler.Config = {
    ...config,
    hot: false,
    sourceMaps: "inline",
  };
  return [
    {
      name: "marko:virtual",
      resolveId: {
        filter: { id: virtualFileReg },
        async handler(source, importer) {
          if (!importer) return null;

          const id = normalizePath(path.resolve(importer, "..", source));
          if (!/\.(?:[cm]?[jt]s|json)$/i.test(id)) {
            const virtualId = await cacheVirtualFile(id);
            if (virtualId) {
              return {
                id: virtualId,
                external: "absolute",
              };
            }
          }

          return id;
        },
      },
      load: {
        filter: { id: virtualFileReg },
        async handler(id) {
          const file = virtualFiles.get(id);
          return (
            file && {
              code: (await file).code,
              moduleType: path.extname(id).slice(1) as Rolldown.ModuleType,
            }
          );
        },
      },
    },
    {
      name: "marko",
      resolveId: {
        filter: { id: /^<([^>]+)>$/ },
        handler(source, importer) {
          const tagName = importer && source.slice(1, -1);
          if (tagName) {
            const tagDef = compiler.taglib
              .buildLookup(path.dirname(importer))
              .getTag(tagName);
            const tagFile = tagDef && (tagDef.template || tagDef.renderer);
            if (tagFile) {
              return { id: tagFile };
            }
          }
        },
      },
      load: {
        filter: { id: /\.marko$/ },
        async handler(id) {
          // Entry-suffixed ids (eg `x.update-entry.marko`, resolved from
          // `x.marko?update` imports) have no file on disk -- scan the
          // source template they wrap instead.
          const entryMatch = /\.[a-z]+-entry(\.marko)$/.exec(id);
          if (entryMatch) {
            id = id.slice(0, -entryMatch[0].length) + entryMatch[1];
          }
          const code = await this.fs.readFile(id, { encoding: "utf8" });
          const compiled = await compiler.compile(code, id, baseConfig);
          return {
            code: nodeModulesReg.test(id)
              ? compiled.code
              : compiled.code + scan(id, code),
            moduleType: "js",
          };
        },
      },
    },
  ];
}
