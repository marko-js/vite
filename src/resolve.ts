import fs from "fs";
import path from "path";
import { resolveSync } from "resolve-sync";

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
    if (isAbsolute) {
      try {
        const pkgPath = path.join(modulePathReg.exec(id)![0], "package.json");
        isCJS = isCJSPkg(JSON.parse(fs.readFileSync(pkgPath, "utf8")));
      } catch {
        // ignore
      }
    } else {
      // The resolved entry point is unused; the fs hook captures the
      // package.json of the package the resolver picks, which works even
      // when its exports map does not expose an entry to resolve.
      resolveSync(moduleId, {
        from: fromFile,
        silent: true,
        fs: {
          isFile(file) {
            try {
              return fs.statSync(file).isFile();
            } catch {
              return false;
            }
          },
          readPkg(file) {
            try {
              const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
              if (pkg && typeof pkg === "object") {
                isCJS ??= isCJSPkg(pkg);
              }
              return pkg;
            } catch {
              // ignore
            }
          },
        },
      });
    }

    cjsModuleLookup.set(moduleId, (isCJS ??= false));
  }

  return isCJS;
}

function isCJSPkg(pkg: { type?: unknown; exports?: unknown }): boolean {
  return pkg.type !== "module" && !pkg.exports;
}
