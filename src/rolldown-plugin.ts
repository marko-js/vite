import * as compiler from "@marko/compiler";
import path from "path";
import type { ModuleType, Plugin } from "rolldown";

import { normalizePath } from "./normalize-path";
import { scan } from "./scan";

const virtualFileReg = /\.marko-virtual\./;
const nodeModulesReg = /[\\/]node_modules[\\/]/;

export default function rolldownPlugin(
  config: compiler.Config,
  virtualFiles: Map<string, { code: string } | Promise<{ code: string }>>,
  cacheVirtualFile: (path: string) => Promise<undefined | string>,
): Plugin[] {
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
              moduleType: path.extname(id).slice(1) as ModuleType,
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
