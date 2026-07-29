import assert from "assert";

import {
  planOnlyMergeSideEffect,
  rewriteLoadEntryPersistedImports,
} from "../persisted-print-skip";

describe("plan-only dual-entry helpers (fail closed)", () => {
  it("rewrites load-entry ?persisted imports to the merge virtual", () => {
    const code = `Promise.all([import("./page.marko"), import("./page.marko?persisted")])`;
    const out = rewriteLoadEntryPersistedImports(
      code,
      "/app/page.marko",
      "virtual:marko-run/artifact/merge1",
    );
    assert.equal(
      out,
      `Promise.all([import("./page.marko"), import("virtual:marko-run/artifact/merge1")])`,
    );
    assert.doesNotMatch(out, /\?persisted/);
  });

  it("throws when load-entry still has ?persisted but no merge mapping", () => {
    assert.throws(
      () =>
        rewriteLoadEntryPersistedImports(
          `import("./x.marko?persisted")`,
          "/app/x.marko",
          undefined,
        ),
      /no merge artifact was published/,
    );
  });

  it("throws when rewrite leaves residual ?persisted text", () => {
    // Comment retains ?persisted after the import is rewritten — fail closed.
    const code =
      'import("./a.marko?persisted"); /* still ?persisted for diagnostics */';
    assert.throws(
      () =>
        rewriteLoadEntryPersistedImports(
          code,
          "/app/x.marko",
          "virtual:marko-run/artifact/m",
        ),
      /unresolved \?persisted imports after rewrite/,
    );
  });

  it("emits a side-effect merge import for empty plan-only modules", () => {
    assert.equal(
      planOnlyMergeSideEffect(
        "/app/widget.marko",
        "virtual:marko-run/artifact/w",
      ),
      'import "virtual:marko-run/artifact/w";\n',
    );
  });

  it("throws instead of emitting an empty plan-only module", () => {
    assert.throws(
      () => planOnlyMergeSideEffect("/app/widget.marko", undefined),
      /refusing empty module/,
    );
  });
});
