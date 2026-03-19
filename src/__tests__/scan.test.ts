import assert from "assert";
import fs from "fs";
import path from "path";
import url from "url";

import { scan } from "../scan";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

describe("scan", () => {
  it("collects nested node_modules marko tags from open tag names", () => {
    const filename = path.join(
      __dirname,
      "fixtures/isomorphic-marko-dep/src/template.marko",
    );
    const imports = scan(filename, fs.readFileSync(filename, "utf8"));

    assert.equal(
      imports,
      [
        '\nimport "test-package/components/implicit-component.marko";',
        '\nimport "test-package/components/class-component.marko";',
      ].join(""),
    );
  });
});
