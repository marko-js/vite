import fs from "fs";
import path from "path";
import Resolve, { type Opts as ResolveOpts } from "resolve";

const moduleNameReg = /^(?:@[^/\\]+[/\\])?[^/\\]+/;
const modulePathReg =
  /^.*[/\\]node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+[/\\])/;
const cjsModuleLookup = new Map<string, boolean>();

export function isCJSModule(id: string, fromFile: string): boolean {
  if (/\.cjs$/.test(id)) return true;
  if (/\.mjs$/.test(id)) return false;
  if (id[0] === ".") return isCJSModule(fromFile, fromFile);

  const isAbsolute = path.isAbsolute(id);
  const moduleId = moduleNameReg.exec(
    isAbsolute ? id.replace(modulePathReg, "$1").replace(/\\/g, "/") : id,
  )?.[0];
  if (!moduleId) return false;

  let isCJS = cjsModuleLookup.get(moduleId);

  if (isCJS === undefined) {
    try {
      if (isAbsolute) {
        const pkgPath = modulePathReg.exec(id)![0] + "/package.json";
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        isCJS = pkg.type !== "module" && !pkg.exports;
      } else {
        Resolve.sync(moduleId + "/package.json", {
          basedir: path.dirname(fromFile),
          filename: fromFile,
          pathFilter(
            pkg: Record<string, unknown>,
            _pkgFile: string,
            relativePath: string,
          ) {
            isCJS = pkg.type !== "module" && !pkg.exports;
            return relativePath;
          },
        } as ResolveOpts);
        isCJS ??= false;
      }
    } catch {
      isCJS = false;
    }
    cjsModuleLookup.set(moduleId, isCJS);
  }

  return isCJS;
}
