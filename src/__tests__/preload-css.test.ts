import assert from "assert";
import fs from "fs";
import os from "os";
import path from "path";
import type * as viteNamespace from "vite";
import vm from "vm";

import preloadCssPlugin, { patchPreloadHelper } from "../preload-css";

const preloadHelperId = "\0vite/preload-helper.js";

// Runs Vite's preload helper against a stub DOM where each stylesheet link
// loads (or fails) only when the test says so.
function loadHelper(code: string) {
  const links: FakeLink[] = [];
  class FakeLink extends EventTarget {
    rel = "";
    as = "";
    href = "";
    crossOrigin = "";
    setAttribute() {}
  }
  const context = vm.createContext({
    __VITE_IS_MODERN__: true,
    __importMeta: {
      url: "http://localhost/assets/main.js",
      resolve: (specifier: string) =>
        new URL(specifier, "http://localhost/").href,
    },
    document: {
      getElementsByTagName: () => links,
      querySelector: () => null,
      createElement: () => new FakeLink(),
      head: { appendChild: (link: FakeLink) => links.push(link) },
    },
    window: new EventTarget(),
    Event,
    EventTarget,
    Promise,
    URL,
    Error,
  });
  vm.runInContext(
    code
      .replace("export const __vitePreload", "globalThis.__vitePreload")
      .replaceAll("import.meta", "__importMeta"),
    context,
  );
  const preload = context.__vitePreload as (
    load: () => Promise<unknown>,
    deps: string[],
  ) => Promise<unknown>;
  const importChunk = () => {
    const state = { settled: false as false | "resolved" | "rejected" };
    preload(() => Promise.resolve("chunk"), ["assets/lazy.css"]).then(
      () => (state.settled = "resolved"),
      () => (state.settled = "rejected"),
    );
    return state;
  };
  return { links, importChunk };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("preload css", () => {
  let vite: typeof viteNamespace;
  let dir: string;
  let helper: string;

  before(async () => {
    vite = await import("vite");
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "marko-vite-preload-"));
    fs.writeFileSync(
      path.join(dir, "index.html"),
      `<script type="module" src="./main.js"></script>`,
    );
    fs.writeFileSync(path.join(dir, "main.js"), `import("./lazy.js");`);
    fs.writeFileSync(path.join(dir, "lazy.js"), `import "./lazy.css";`);
    fs.writeFileSync(path.join(dir, "lazy.css"), `.lazy { color: teal }`);
    await vite.build({
      root: dir,
      logLevel: "silent",
      build: { write: false },
      plugins: [
        {
          name: "capture-preload-helper",
          transform: {
            filter: { id: /^\0vite\/preload-helper\.js$/ },
            handler(code, id) {
              if (id === preloadHelperId) helper = code;
            },
          },
        },
      ],
    });
  });

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("patches the helper in a build", async () => {
    const output = (await vite.build({
      root: dir,
      logLevel: "silent",
      build: { write: false, minify: false },
      plugins: [preloadCssPlugin()],
    })) as viteNamespace.Rolldown.RolldownOutput;
    assert.ok(
      output.output.some(
        (chunk) =>
          chunk.type === "chunk" && chunk.code.includes("__markoCssLoad"),
      ),
    );
  });

  it("makes every import wait for a stylesheet still loading", async () => {
    const { links, importChunk } = loadHelper(patchPreloadHelper(helper)!);
    const first = importChunk();
    const second = importChunk();
    await flush();
    assert.deepEqual([first.settled, second.settled], [false, false]);

    links[0].dispatchEvent(new Event("load"));
    await flush();
    assert.deepEqual([first.settled, second.settled], ["resolved", "resolved"]);
    const later = importChunk();
    await flush();
    assert.equal(later.settled, "resolved");
  });

  it("fails every import waiting on a stylesheet that fails", async () => {
    const { links, importChunk } = loadHelper(patchPreloadHelper(helper)!);
    const first = importChunk();
    const second = importChunk();
    links[0].dispatchEvent(new Event("error"));
    await flush();
    assert.deepEqual([first.settled, second.settled], ["rejected", "rejected"]);
  });

  it("leaves a helper it does not recognize alone", () => {
    assert.equal(
      patchPreloadHelper("export const __vitePreload = 1"),
      undefined,
    );
  });
});
