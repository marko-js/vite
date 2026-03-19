import * as compiler from "@marko/compiler";
import fs from "fs";
import { createParser, TagType } from "htmljs-parser";
import path from "path";
import { relativeImportPath } from "relative-import-path";

const nmsReg = /[\\/]node_modules[\\/]/;
let cache = new Map<string, Set<string>>();
export function clearScanCache() {
  cache = new Map();
}

export function scan(filename: string, code: string): string {
  let deps = cache.get(filename);
  let imports = "";

  if (!deps) {
    deps = new Set([filename]);
    scanFile(filename, code, deps);
    cache.set(filename, deps);
  }

  for (const dep of deps) {
    if (dep !== filename) {
      imports += `\nimport "${relativeImportPath(filename, dep)}";`;
    }
  }

  return imports;
}

function scanFile(filename: string, code: string, result: Set<string>) {
  const lookup = compiler.taglib.buildLookup(path.dirname(filename));
  const parser = createParser({
    onError() {
      // ignore
    },
    onOpenTagName(range) {
      const tagDef = range.expressions.length
        ? undefined
        : lookup.getTag(parser.read(range));
      const parseOptions = tagDef?.parseOptions;

      if (parseOptions) {
        if (parseOptions.statement) {
          return TagType.statement;
        }

        if (parseOptions.openTagOnly) {
          return TagType.void;
        }

        if (parseOptions.text) {
          return TagType.text;
        }
      }

      if (tagDef && !tagDef.html && tagDef.template) {
        trackTag(tagDef.template, result);
      }

      return TagType.html;
    },
  });

  try {
    parser.parse(code);
  } catch {
    // ignore
  }
}

function trackTag(template: string, result: Set<string>) {
  if (
    !nmsReg.test(template) ||
    !template.endsWith(".marko") ||
    result.has(template)
  ) {
    return;
  }

  let deps = cache.get(template);

  if (!deps) {
    deps = new Set([template]);
    try {
      scanFile(template, fs.readFileSync(template, "utf-8"), deps);
    } catch {
      // ignore
    }

    cache.set(template, deps);
  }

  for (const dep of deps) {
    result.add(dep);
  }
}
