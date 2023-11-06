import { exports } from "resolve.exports";
import Resolve from "resolve";
import type { Opts as ResolveOpts } from "resolve";
import path from "path";
import fs from "fs";

const exportsMainFile = `__package_exports__`;

const modulePathReg = /^.*[/\\]node_modules[/\\](?:@[^/\\]+[/\\])?[^/\\]+[/\\]/;

const cjsModuleLookup = new Map<string, boolean>();
export function isCJSModule(id: string): boolean {
  const modulePath = modulePathReg.exec(id)?.[0];
  if (modulePath) {
    const pkgPath = modulePath + "package.json";
    let isCJS = cjsModuleLookup.get(pkgPath);
    if (isCJS === undefined) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        isCJS = pkg.type !== "module" && !pkg.exports;
      } catch {
        isCJS = false;
      }
      cjsModuleLookup.set(pkgPath, isCJS);
    }
    return isCJS;
  }

  return false;
}

export function resolve(
  id: string,
  from: string,
  extensions: string[],
  conditions: string[]
) {
  return Resolve.sync(id, {
    basedir: path.dirname(from),
    filename: from,
    pathFilter,
    packageFilter,
    extensions,
  } as ResolveOpts);

  function pathFilter(
    pkg: Record<string, unknown>,
    pkgFile: string,
    relativePath: string
  ) {
    cjsModuleLookup.set(pkgFile, pkg.type !== "module" && !pkg.exports);

    if (pkg.exports) {
      return exports(
        pkg,
        relativePath === exportsMainFile ? "." : relativePath,
        {
          conditions,
        }
      )?.[0] as string;
    }

    return relativePath;
  }
}

function packageFilter<
  T extends { main?: unknown; exports?: unknown; browser?: unknown }
>(pkg: T) {
  if (pkg.exports) {
    // defers to the "exports" field.
    pkg.main = exportsMainFile;
  }

  return pkg;
}
