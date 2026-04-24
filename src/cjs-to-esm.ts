import type { Node } from "@chialab/estransform";

let getESTransform = async function getESTransformLib() {
  const mod = await import("@chialab/estransform").catch(() => null);
  getESTransform = () => mod as any;
  return mod;
};

const UMD_REGEXES = [
  /\btypeof\s+(module\.exports|module|exports)\s*===?\s*['|"]object['|"]/,
  /['|"]object['|"]\s*===?\s*typeof\s+(module\.exports|module|exports)/,
  /\btypeof\s+define\s*===?\s*['|"]function['|"]/,
  /['|"]function['|"]\s*===?\s*typeof\s+define/,
];
const EXPORTS_KEYWORDS = /\b(module\.exports\b|exports\b)/;
const CJS_KEYWORDS = /\b(module\.exports\b|exports\b|require[.(])/;

const REQUIRE_FUNCTION = "__cjs_default__";

const GLOBAL_HELPER = `((typeof window !== 'undefined' && window) ||
(typeof self !== 'undefined' && self) ||
(typeof global !== 'undefined' && global) ||
(typeof globalThis !== 'undefined' && globalThis) ||
{})`;

const REQUIRE_HELPER = `function ${REQUIRE_FUNCTION}(requiredModule) {
    var Object = ${GLOBAL_HELPER}.Object;
    var isEsModule = false;
    var specifiers = Object.create(null);
    var hasNamedExports = false;
    var hasDefaultExport = false;

    Object.defineProperty(specifiers, '__esModule', {
        value: true,
        enumerable: false,
        configurable: true,
    });

    if (requiredModule) {
        var names = Object.getOwnPropertyNames(requiredModule);;
        names.forEach(function(k) {
            if (k === 'default') {
                hasDefaultExport = true;
            } else if (!hasNamedExports && !(k === '__esModule' || k === 'module.exports')) {
                try {
                    hasNamedExports = requiredModule[k] != null;
                } catch (err) {
                    //
                }
            }
            Object.defineProperty(specifiers, k, {
                get: function () {
                    return requiredModule[k];
                },
                enumerable: true,
                configurable: false,
            });
        });
        if (Object.getOwnPropertySymbols) {
            var symbols = Object.getOwnPropertySymbols(requiredModule);
            symbols.forEach(function(k) {
                Object.defineProperty(specifiers, k, {
                    get: function () {
                        return requiredModule[k];
                    },
                    enumerable: false,
                    configurable: false,
                });
            });
        }

        Object.preventExtensions(specifiers);
        Object.seal(specifiers);
        if (Object.freeze) {
            Object.freeze(specifiers);
        }
    }

    if (hasNamedExports) {
        return specifiers;
    }

    if (hasDefaultExport) {
        if (Object.isExtensible(specifiers.default) && !('default' in specifiers.default)) {
            Object.defineProperty(specifiers.default, 'default', {
                value: specifiers.default,
                configurable: false,
                enumerable: false,
            })
        }
        return specifiers.default;
    }

    return specifiers;
}
`;

export default async function (code: string, id: string) {
  const estransform = await getESTransform();
  if (!estransform) {
    return;
  }

  const { parse, parseCommonjs, parseEsm, walk } = estransform;

  if (!CJS_KEYWORDS.test(code)) {
    throw new Error("Cannot convert mixed modules");
  }
  try {
    const [imports, exports] = await parseEsm(code);
    if (imports.length !== 0 || exports.length !== 0) {
      throw new Error("Cannot convert mixed modules");
    }
  } catch {
    //
  }

  const specs = new Map();
  const ns = new Map();
  const { ast, helpers } = await parse(code, id);
  const isUmd = UMD_REGEXES.some((regex) => regex.test(code));

  let insertHelper = false;
  if (!isUmd) {
    const ignoredExpressions: Node[] = [];

    walk(ast, {
      TryStatement(node) {
        walk(node.block, {
          CallExpression(node) {
            if (
              node.callee.type !== "Identifier" ||
              node.callee.name !== "require"
            ) {
              return;
            }
            ignoredExpressions.push(node);
          },
        });
      },
    });

    const callExpressions: Node[] = [];
    walk(ast, {
      CallExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "require"
        ) {
          return;
        }

        if (ignoredExpressions.includes(node)) {
          return;
        }

        const specifier = node.arguments[0];
        if (specifier.type === "StringLiteral") {
          callExpressions.push(node);
        }
      },
    });

    await Promise.all(
      callExpressions.map(async (callExp) => {
        const specifier = callExp.arguments[0];
        let spec = specs.get(specifier.value);
        if (!spec) {
          let id = `$cjs$${specifier.value.replace(/[^\w_$]+/g, "_")}`;
          const count = (ns.get(id) || 0) + 1;
          ns.set(id, count);
          if (count > 1) {
            id += count;
          }
          spec = { id, specifier: specifier.value };
          specs.set(specifier, spec);
        }

        insertHelper = true;
        helpers.overwrite(
          callExp.callee.start,
          callExp.callee.end,
          REQUIRE_FUNCTION,
        );
        helpers.overwrite(
          specifier.start,
          specifier.end,
          `typeof ${spec.id} !== 'undefined' ? ${spec.id} : {}`,
        );
      }),
    );
  }

  const { exports, reexports } = await parseCommonjs(code);
  const named = exports.filter(
    (entry) => entry !== "__esModule" && entry !== "default",
  );
  const isEsModule = exports.includes("__esModule");
  const hasDefault = exports.includes("default");

  if (isUmd) {
    let endDefinition = code.indexOf("'use strict';");
    if (endDefinition === -1) {
      endDefinition = code.indexOf('"use strict";');
    }
    if (endDefinition === -1) {
      endDefinition = code.length;
    }

    helpers.prepend(`var __umdGlobal = ${GLOBAL_HELPER};
var __umdExports = [];
var __umdRoot = new Proxy(__umdGlobal, {
    get: function(target, name) {
        var value = Reflect.get(target, name);
        if (__umdExports.indexOf(name) !== -1) {
            return value;
        }
        if (typeof value === 'function' && !value.prototype) {
            return value.bind(__umdGlobal);
        }
        return value;
    },
    set: function(target, name, value) {
        __umdExports.push(name);
        return Reflect.set(target, name, value);
    },
});
var __umdFunction = function ProxyFunction(code) {
    return __umdGlobal.Function(code).bind(__umdRoot);
};
__umdFunction.prototype = Function.prototype;
(function(window, global, globalThis, self, module, exports, Function) {
`);
    helpers.append(`
}).call(__umdRoot, __umdRoot, __umdRoot, __umdRoot, __umdRoot, undefined, undefined, __umdFunction);

export default (__umdExports.length !== 1 && __umdRoot[__umdExports[0]] !== __umdRoot[__umdExports[1]] ? __umdRoot : __umdRoot[__umdExports[0]]);`);
  } else if (exports.length > 0 || reexports.length > 0) {
    helpers.prepend(`var global = ${GLOBAL_HELPER};
var exports = {};
var module = {
    get exports() {
        return exports;
    },
    set exports(value) {
        exports = value;
    },
};
`);

    if (named.length) {
      const conditions = ["Object.isExtensible(module.exports)"];
      if (!hasDefault && !isEsModule) {
        // add an extra conditions for some edge cases not handled by the cjs lexer
        // such as an object exports that has a function as first member.
        conditions.push(
          `Object.keys(module.exports).length === ${named.length}`,
        );
      }

      helpers.append(`\nvar ${named.map((_name, index) => `__export${index}`).join(", ")};
if (${conditions.join(" && ")}) {
    ${named.map((name, index) => `__export${index} = module.exports['${name}'];`).join("\n    ")}
}`);

      helpers.append(
        `\nexport { ${named.map((name, index) => `__export${index} as "${name}"`).join(", ")} }`,
      );
    }
    if (isEsModule) {
      if (!isUmd && (hasDefault || named.length === 0)) {
        helpers.append(
          "\nexport default (module.exports != null && typeof module.exports === 'object' && 'default' in module.exports ? module.exports.default : module.exports);",
        );
      }
    } else {
      helpers.append("\nexport default module.exports;");
    }

    reexports.forEach((reexport) => {
      helpers.append(`\nexport * from '${reexport}';`);
    });
  } else if (EXPORTS_KEYWORDS.test(code)) {
    helpers.prepend(`var global = ${GLOBAL_HELPER};
var exports = {};
var module = {
    get exports() {
        return exports;
    },
    set exports(value) {
        exports = value;
    },
};
`);
    helpers.append("\nexport default module.exports;");
  }

  if (insertHelper) {
    helpers.prepend(`// Require helper for interop\n${REQUIRE_HELPER}`);
  }

  specs.forEach((spec) => {
    helpers.prepend(`import * as ${spec.id} from "${spec.specifier}";\n`);
  });

  if (!helpers.isDirty()) {
    return;
  }

  return helpers.generate({
    sourcemap: true,
    sourcesContent: false,
  });
}
