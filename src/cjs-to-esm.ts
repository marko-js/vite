import { init, parse as parseCommonjs } from "cjs-module-lexer";
import { init as initEsm, parse as parseEsm } from "es-module-lexer";
import MagicString from "magic-string";

const REQUIRE_RE = /([^.\w$]|^)require\s*\(\s*(['"])(.*?)\2\s*\)/g;
const REQUIRE_TEST_RE = /([^.\w$]|^)require\s*\(\s*['"]/;
const EXPORTS_RE = /\b(module\.exports|exports)\b/;
const CJS_INTEROP_HELPER = `function __cjs_default__(ns) {
  var keys = Object.getOwnPropertyNames(ns);
  var hasNamed = false;
  var hasDefault = false;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k === "default") {
      hasDefault = true;
    } else if (k !== "__esModule" && k !== "module.exports") {
      try { if (ns[k] != null) hasNamed = true; } catch(e) {}
    }
  }
  if (hasNamed) return ns;
  if (hasDefault) return ns["default"];
  return ns;
}`;

let initialized = false;

export async function transformCjsToEsm(
  code: string,
  _id: string,
): Promise<{
  code: string;
  map: ReturnType<MagicString["generateMap"]>;
} | null> {
  if (!EXPORTS_RE.test(code) && !REQUIRE_TEST_RE.test(code)) {
    return null;
  }

  if (!initialized) {
    await Promise.all([init(), initEsm]);
    initialized = true;
  }

  const [esImports, esExports] = parseEsm(code);
  if (esImports.length || esExports.length) {
    return null;
  }

  const s = new MagicString(code);
  const imports: string[] = [];
  const seen = new Map<string, string>();
  let counter = 0;
  let needsHelper = false;
  let match: RegExpExecArray | null;

  REQUIRE_RE.lastIndex = 0;

  while ((match = REQUIRE_RE.exec(code))) {
    const [fullMatch, prefix, , specifier] = match;
    const matchStart = match.index + prefix.length;
    const matchEnd = match.index + fullMatch.length;

    let varName = seen.get(specifier);
    if (!varName) {
      varName = `__cjs_ns_${counter}__`;
      seen.set(specifier, varName);
      imports.push(`import * as ${varName} from ${JSON.stringify(specifier)};`);
      counter++;
    }

    needsHelper = true;
    s.overwrite(matchStart, matchEnd, `__cjs_default__(${varName})`);
  }

  if (needsHelper) {
    imports.unshift(CJS_INTEROP_HELPER);
  }

  if (imports.length > 0) {
    s.prepend(imports.join("\n") + "\n");
  }

  if (EXPORTS_RE.test(code)) {
    s.prepend(
      `var exports = {};\n` +
        `var module = {\n` +
        `  get exports() { return exports; },\n` +
        `  set exports(value) { exports = value; },\n` +
        `};\n`,
    );

    const { exports: cjsExports, reexports } = parseCommonjs(code);
    const named = cjsExports.filter(
      (e) => e !== "__esModule" && e !== "default",
    );
    const isEsModule = cjsExports.includes("__esModule");
    const hasDefault = cjsExports.includes("default");

    if (named.length > 0) {
      const vars = named.map((_name, i) => `__export${i}`);
      s.append(
        `\nvar ${vars.join(", ")};\n` +
          `if (Object.isExtensible(module.exports)) {\n` +
          named
            .map(
              (name, i) =>
                `  ${vars[i]} = module.exports[${JSON.stringify(name)}];`,
            )
            .join("\n") +
          `\n}\n`,
      );
      s.append(
        `export { ${named.map((name, i) => `${vars[i]} as ${JSON.stringify(name)}`).join(", ")} };\n`,
      );
    }

    if (isEsModule) {
      if (hasDefault || named.length === 0) {
        s.append(
          `export default (module.exports != null && typeof module.exports === 'object' && 'default' in module.exports ? module.exports.default : module.exports);\n`,
        );
      }
    } else {
      s.append(`export default module.exports;\n`);
    }

    for (const reexport of reexports) {
      s.append(`export * from ${JSON.stringify(reexport)};\n`);
    }
  }

  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}
