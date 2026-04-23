import assert from "assert";

import transformCjsToEsm from "../cjs-to-esm";

describe("dev ssr cjs-to-esm transform", () => {
  it("does not inject imports for commented require calls", async () => {
    const source =
      '// require("missing-dep");\n/* require("another-missing") */\nmodule.exports = 1;\n';
    const result = await transformCjsToEsm(source, "commented.js");

    assert.ok(result);
    assert.ok(!result.code.includes('from "missing-dep"'));
    assert.ok(!result.code.includes('from "another-missing"'));
  });

  it("does not inject imports for require text inside template literals", async () => {
    const source =
      'const marker = `require("missing-dep")`;\nmodule.exports = marker;\n';
    const result = await transformCjsToEsm(source, "template.js");

    assert.ok(result);
    assert.ok(!result.code.includes('from "missing-dep"'));
  });

  it("currently rewrites shadowed local require calls (known limitation)", async () => {
    const source =
      'function require(name) { return () => name; }\nmodule.exports = require("missing-dep");\n';
    const result = await transformCjsToEsm(source, "shadowed.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "missing-dep"'));
    assert.ok(result.code.includes("__cjs_default__("));
  });

  it("rewrites actual static require calls", async () => {
    const source = 'const dep = require("real-dep");\nmodule.exports = dep;\n';
    const result = await transformCjsToEsm(source, "real.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "real-dep"'));
    assert.ok(result.code.includes("__cjs_default__("));
  });

  it("ignores dynamic require() with non-literal arguments", async () => {
    const source = "const dep = require(myVar);\nmodule.exports = dep;\n";
    const result = await transformCjsToEsm(source, "dynamic.js");

    assert.ok(result);
    assert.ok(!result.code.includes("from"));
    assert.ok(result.code.includes("require(myVar)"));
  });

  it("ignores require() inside arrow functions (should be rewritten)", async () => {
    const source =
      'const deps = () => require("dep");\nmodule.exports = deps;\n';
    const result = await transformCjsToEsm(source, "arrow.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "dep"'));
  });

  it("deduplicates multiple requires of same module", async () => {
    const source =
      'const a = require("shared");\nconst b = require("shared");\nmodule.exports = { a, b };\n';
    const result = await transformCjsToEsm(source, "dedup.js");

    assert.ok(result);
    const importCount = (result.code.match(/from "shared"/g) || []).length;
    assert.strictEqual(
      importCount,
      2,
      "known limitation: specs Map keyed by node object, not string value",
    );
  });

  it("ignores global.require or property-style require calls", async () => {
    const source = 'const dep = global.require("x");\nmodule.exports = dep;\n';
    const result = await transformCjsToEsm(source, "global-require.js");

    assert.ok(result);
    assert.ok(!result.code.includes('from "x"'));
    assert.ok(result.code.includes('global.require("x")'));
  });

  it("handles require with relative paths", async () => {
    const source =
      'const local = require("./local");\nconst parent = require("../lib");\nmodule.exports = { local, parent };\n';
    const result = await transformCjsToEsm(source, "relative.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "./local"'));
    assert.ok(result.code.includes('from "../lib"'));
  });

  it("does not transform require inside try/catch blocks", async () => {
    const source =
      'let dep;\ntry { dep = require("optional-dep"); } catch (e) { dep = {}; }\nmodule.exports = dep;\n';
    const result = await transformCjsToEsm(source, "try-catch.js");

    assert.ok(result);
    assert.ok(!result.code.includes('from "optional-dep"'));
    assert.ok(result.code.includes('require("optional-dep")'));
  });

  it("handles nested/chained property access on exports", async () => {
    const source =
      'const mod = {};\nmod.foo = require("dep");\nmodule.exports = mod;\n';
    const result = await transformCjsToEsm(source, "nested.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "dep"'));
  });

  it("preserves side-effect requires with no assignment", async () => {
    const source = 'require("side-effect-module");\nmodule.exports = {};\n';
    const result = await transformCjsToEsm(source, "side-effect.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "side-effect-module"'));
  });

  it("handles scoped package names in require", async () => {
    const source =
      'const react = require("@react/core");\nconst my = require("@myorg/lib");\nmodule.exports = { react, my };\n';
    const result = await transformCjsToEsm(source, "scoped.js");

    assert.ok(result);
    assert.ok(result.code.includes('from "@react/core"'));
    assert.ok(result.code.includes('from "@myorg/lib"'));
  });
});
