import assert from "assert";
import path from "path";
import url from "url";
import type * as viteNamespace from "vite";

import markoPlugin from "..";
import { cleanUrl, hasOpaqueQuery } from "../query";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, "fixtures/browser-basic");
const TEMPLATE = "/src/template.marko";

describe("cleanUrl", () => {
  const cases: [id: string, expected: string][] = [
    ["/src/template.marko", "/src/template.marko"],
    ["/src/template.marko?cache=123", "/src/template.marko"],
    ["/src/template.marko?v=abc", "/src/template.marko"],
    ["/src/template.marko?t=123", "/src/template.marko"],
    ["/src/template.marko?raw", "/src/template.marko"],
    [
      "/src/template.marko?cache=123&vitest-uncovered-coverage=true",
      "/src/template.marko",
    ],
  ];

  for (const [id, expected] of cases) {
    it(`${id} -> ${expected}`, () => {
      assert.equal(cleanUrl(id), expected);
    });
  }

  it("never leaves a dangling separator", () => {
    for (const [id] of cases) {
      const cleaned = cleanUrl(id);
      assert.ok(!/[?&]$/.test(cleaned), `${id} -> ${cleaned}`);
      assert.ok(!cleaned.includes("?"), `${id} -> ${cleaned}`);
    }
  });
});

// `.marko` files are compiled when `cleanUrl(id)` names one and the query is
// not opaque, so anything below that is not opaque is compiled.
describe("hasOpaqueQuery", () => {
  const cases: [id: string, expected: boolean][] = [
    ["/src/template.marko", false],
    ["/src/template.marko?cache=123", false],
    ["/src/template.marko?v=abc", false],
    ["/src/template.marko?t=123", false],
    ["/src/template.marko?cache=123&vitest-uncovered-coverage=true", false],
    ["/src/template.marko?raw", true],
    ["/src/template.marko?url", true],
    ["/src/template.marko?inline", true],
    ["/src/template.marko?worker", true],
    ["/src/template.marko?cache=123&raw", true],
    ["/src/template.marko.html?html-proxy&index=0.js", true],
    // `raw` only counts as its own query param.
    ["/src/template.marko?rawr", false],
    ["/src/template.marko?not-raw", false],
  ];

  for (const [id, expected] of cases) {
    it(`${id} -> ${expected}`, () => {
      assert.equal(hasOpaqueQuery(id), expected);
    });
  }
});

describe("templates with a query", () => {
  let vite: typeof viteNamespace;
  let server: viteNamespace.ViteDevServer;

  before(async () => {
    vite = await import("vite");
    server = await vite.createServer({
      root: FIXTURE_DIR,
      logLevel: "error",
      server: { middlewareMode: true, hmr: false, watch: null },
      // Requesting the same file with and without a query re-triggers dep
      // discovery, which leaves `server.close()` hanging.
      optimizeDeps: { noDiscovery: true, include: [] },
      plugins: [markoPlugin({ linked: false })],
    });
  });

  after(async () => {
    await server?.close();
  });

  // The hmr client keys the module by the requested url; a transparent query
  // must leave everything else identical to the plain request.
  const transform = async (id: string) =>
    (await server.environments.client.transformRequest(id))?.code.replaceAll(
      JSON.stringify(id),
      JSON.stringify(TEMPLATE),
    );

  it("compiles a template requested with an unknown marker query", async () => {
    // `@vitest/coverage-*` re-requests uncovered files with a marker like this.
    assert.equal(
      await transform(`${TEMPLATE}?cache=123&vitest-uncovered-coverage=true`),
      await transform(TEMPLATE),
    );
  });

  it("compiles a template requested with a cache busting query", async () => {
    assert.equal(
      await transform(`${TEMPLATE}?v=abc`),
      await transform(TEMPLATE),
    );
  });

  it("leaves ?raw as the template source", async () => {
    const code = await transform(`${TEMPLATE}?raw`);
    assert.ok(
      code?.includes("<div#page>"),
      `expected the template source, got:\n${code}`,
    );
  });

  it("leaves ?url as the template url", async () => {
    const code = await transform(`${TEMPLATE}?url`);
    assert.ok(
      code?.includes(JSON.stringify(TEMPLATE)),
      `expected the template url, got:\n${code}`,
    );
  });
});
