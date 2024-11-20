import type http from "http";

import fs from "fs";
import net from "net";
import path from "path";
import url from "url";
import { once } from "events";
import snap from "mocha-snap";
import { JSDOM } from "jsdom";
import { createRequire } from "module";
import * as playwright from "playwright";
import { defaultNormalizer, defaultSerializer } from "@marko/fixture-snapshots";
import markoPlugin, { type Options } from "..";
import type { Http2SecureServer } from "http2";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

declare global {
  const page: playwright.Page;
  namespace NodeJS {
    interface Global {
      page: playwright.Page;
    }
  }
}

declare namespace globalThis {
  let page: playwright.Page;
}

declare const __track__: (html: string) => void;
type Step = () => Promise<unknown> | unknown;

const requireCwd = createRequire(process.cwd());
let vite: typeof import("vite");
let browser: playwright.Browser;
let changes: string[] = [];

before(async () => {
  vite = await import("vite");
  browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript("window.__name = v=>v");
  globalThis.page = await context.newPage();
  /**
   * We add a mutation observer to track all mutations (batched)
   * Then we report the list of mutations in a normalized way and snapshot it.
   */

  await Promise.all([
    context.exposeFunction("__track__", (html: string) => {
      const formatted = defaultSerializer(
        defaultNormalizer(JSDOM.fragment(html)),
      )
        .replace(/-[a-z0-9_-]+(\.\w+)/gi, "-[hash]$1")
        .replace(/[?&][tv]=[\d.]+/, "");

      if (changes.at(-1) !== formatted) {
        changes.push(formatted);
      }
    }),
    context.addInitScript(() => {
      const getRoot = () => document.getElementById("app");
      const observer = new MutationObserver(() => {
        const html = getRoot()?.innerHTML;
        if (html) {
          __track__(html);
          observer.disconnect();
          queueMicrotask(observe);
        }
      });

      let errorContainer: HTMLElement | null = null;
      window.addEventListener("error", onError);
      document.addEventListener("error", onError, true);

      function onError(evt: ErrorEvent) {
        if (!errorContainer) {
          errorContainer = document.createElement("pre");
          (getRoot() || document.body).appendChild(errorContainer);
        }

        errorContainer.insertAdjacentText(
          "beforeend",
          `${evt.error || `Error loading ${(evt.target as any).outerHTML}`}\n`,
        );
      }

      observe();
      function observe() {
        observer.observe(getRoot() || document, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }
    }),
  ]);
});

beforeEach(() => {
  changes = [];
});

after(() => browser.close());

const FIXTURES = path.join(__dirname, "fixtures");

for (const fixture of fs.readdirSync(FIXTURES)) {
  describe(fixture, () => {
    const dir = path.join(FIXTURES, fixture);
    const config = requireCwd(path.join(dir, "test.config.ts")) as {
      ssr: boolean;
      steps?: Step | Step[];
      options?: Options;
      env?: Record<string, string>;
    };

    if (config.env) {
      const preservedEnv: [string, string | undefined | false][] = [];
      before(() => {
        for (const [key, value] of Object.entries(config.env!)) {
          preservedEnv.push([
            key,
            key in process.env ? process.env[key] : false,
          ]);
          process.env[key] = value;
        }
      });

      after(() => {
        for (const [key, value] of preservedEnv) {
          if (value === false) {
            delete process.env[key];
          } else {
            process.env[key] = value;
          }
        }
      });
    }

    const steps: Step[] = config.steps
      ? Array.isArray(config.steps)
        ? config.steps
        : [config.steps]
      : [];

    if (config.ssr) {
      it("dev", async () => {
        await testPage(
          dir,
          steps,
          (
            await import(
              url.pathToFileURL(path.join(dir, "dev-server.mjs")).href
            )
          ).default.listen(0),
        );
      });

      it("build", async () => {
        await vite.build({
          root: dir,
          configFile: false,
          logLevel: "error",
          plugins: [markoPlugin(config.options)],
          build: {
            write: true,
            minify: false,
            assetsInlineLimit: 0,
            emptyOutDir: false, // Avoid server / client deleting files from each other.
            ssr: path.join(dir, "src/index.js"),
          },
        });

        await vite.build({
          root: dir,
          configFile: false,
          logLevel: "error",
          plugins: [markoPlugin(config.options)],
          build: {
            write: true,
            minify: false,
            assetsInlineLimit: 0,
            emptyOutDir: false, // Avoid server / client deleting files from each other.
          },
        });

        await testPage(
          dir,
          steps,
          (
            await import(url.pathToFileURL(path.join(dir, "server.mjs")).href)
          ).default.listen(0),
        );
      });
    } else {
      it("dev", async () => {
        const devServer = await vite.createServer({
          root: dir,
          configFile: false,
          server: {
            watch: {
              ignored: [
                "**/node_modules/**",
                "**/dist/**",
                "**/__snapshots__/**",
              ],
            },
          },
          logLevel: "error",
          optimizeDeps: { force: true },
          plugins: [markoPlugin({ ...config.options, linked: false })],
        });

        devServer.listen(await getAvailablePort());
        devServer.httpServer!.once("close", () => devServer.close());
        await testPage(dir, steps, devServer.httpServer!);
      });

      it("build", async () => {
        await vite.build({
          root: dir,
          configFile: false,
          logLevel: "error",
          plugins: [markoPlugin({ ...config.options, linked: false })],
          build: {
            write: true,
            minify: false,
          },
        });

        await testPage(
          dir,
          steps,
          (
            await vite.preview({
              root: dir,
              configFile: false,
              server: {
                watch: {
                  ignored: [
                    "**/node_modules/**",
                    "**/dist/**",
                    "**/__snapshots__/**",
                  ],
                },
              },
              preview: { port: await getAvailablePort() },
            })
          ).httpServer,
        );
      });
    }
  });
}

async function testPage(
  dir: string,
  steps: Step[],
  server: http.Server | Http2SecureServer,
) {
  try {
    if (!server.listening) await once(server, "listening");

    const href = `http://localhost:${
      (server.address() as net.AddressInfo).port
    }`;
    await waitForPendingRequests(page, () => page.goto(href));

    const title = await page.title();
    if (title === "Error") {
      const error = new Error("Error in response");
      const pre = await page.waitForSelector("pre");
      const html = await pre.innerHTML();
      if (html) {
        error.stack = JSDOM.fragment(html.replace(/<br>/g, "\n")).textContent!;
      }
      throw error;
    }

    await page.waitForSelector("#app");
    await forEachChange((html, i) =>
      snap(html, { ext: `.loading.${i}.html`, dir }),
    );

    for (const [i, step] of steps.entries()) {
      await waitForPendingRequests(page, step);
      await forEachChange((html, j) =>
        snap(html, { ext: `.step-${i}.${j}.html`, dir }),
      );
    }
  } finally {
    server.close();
  }
}

/**
 * Applies changes currently and ensures no new changes come in while processing.
 */
async function forEachChange<F extends (html: string, i: number) => unknown>(
  fn: F,
) {
  const len = changes.length;
  await Promise.all(changes.map(fn));

  if (len !== changes.length) {
    throw new Error("A mutation occurred when the page should have been idle.");
  }

  changes = [];
}

/**
 * Utility to run a function against the current page and wait until every
 * in flight network request has completed before continuing.
 */
async function waitForPendingRequests(page: playwright.Page, step: Step) {
  let remaining = 0;
  let resolve!: () => void;
  const addOne = () => remaining++;
  const finishOne = async () => {
    // wait a tick to see if new requests start from this one.
    await page.evaluate(() => {});
    if (!--remaining) resolve();
  };
  const pending = new Promise<void>((_resolve) => (resolve = _resolve));

  page.on("request", addOne);
  page.on("requestfinished", finishOne);
  page.on("requestfailed", finishOne);

  try {
    addOne();
    await step();
    finishOne();
    await pending;
  } finally {
    page.off("request", addOne);
    page.off("requestfinished", finishOne);
    page.off("requestfailed", finishOne);
  }
}

async function getAvailablePort() {
  return new Promise<number>((resolve) => {
    const server = net.createServer().listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}
