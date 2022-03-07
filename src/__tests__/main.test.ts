import type http from "http";

import fs from "fs";
import net from "net";
import path from "path";
import { once } from "events";
import * as vite from "vite";
import snap from "mocha-snap";
import { JSDOM } from "jsdom";
import { pathToFileURL } from "url";
import * as playwright from "playwright";
import { defaultNormalizer, defaultSerializer } from "@marko/fixture-snapshots";
import markoPlugin from "..";

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

let browser: playwright.Browser;
let changes: string[] = [];

before(async () => {
  browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  globalThis.page = await context.newPage();
  /**
   * We add a mutation observer to track all mutations (batched)
   * Then we report the list of mutations in a normalized way and snapshot it.
   */
  await Promise.all([
    context.exposeFunction("__track__", (html: string) => {
      const formatted = defaultSerializer(
        defaultNormalizer(JSDOM.fragment(html))
      );

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

after(() => browser.close());

const FIXTURES = path.join(__dirname, "fixtures");

for (const fixture of fs.readdirSync(FIXTURES)) {
  describe(fixture, () => {
    const dir = path.join(FIXTURES, fixture);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(path.join(dir, "test.config.ts")) as {
      ssr: boolean;
      steps?: Step | Step[];
    };
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
            await (
              await import(
                pathToFileURL(path.join(dir, "dev-server.js")).toString()
              )
            ).default
          ).listen(0)
        );
      });

      it("build", async () => {
        await vite.build({
          root: dir,
          logLevel: "silent",
          plugins: [markoPlugin()],
          build: {
            write: true,
            minify: false,
            emptyOutDir: false, // Avoid server / client deleting files from each other.
            ssr: path.join(dir, "src/index.js"),
          },
        });

        await vite.build({
          root: dir,
          logLevel: "silent",
          plugins: [markoPlugin()],
          build: {
            write: true,
            minify: false,
            emptyOutDir: false, // Avoid server / client deleting files from each other.
          },
        });

        await testPage(
          dir,
          steps,
          (
            await import(pathToFileURL(path.join(dir, "server.js")).toString())
          ).default.listen(0)
        );
      });
    } else {
      it("dev", async () => {
        const devServer = await vite.createServer({
          root: dir,
          logLevel: "silent",
          server: { force: true },
          plugins: [markoPlugin({ linked: false })],
        });

        devServer.listen();
        devServer.httpServer!.once("close", () => devServer.close());
        await testPage(dir, steps, devServer.httpServer!);
      });

      it("build", async () => {
        await vite.build({
          root: dir,
          logLevel: "silent",
          plugins: [markoPlugin({ linked: false })],
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
              preview: { port: await getAvailablePort() },
            })
          ).httpServer
        );
      });
    }
  });
}

async function testPage(dir: string, steps: Step[], server: http.Server) {
  try {
    if (!server.listening) await once(server, "listening");

    const href = `http://localhost:${
      (server.address() as net.AddressInfo).port
    }`;
    await page.goto(href, { waitUntil: "networkidle" });
    await page.waitForSelector("#app");
    await forEachChange((html, i) => snap(html, `.loading.${i}.html`, dir));

    for (const [i, step] of steps.entries()) {
      await step();
      await forEachChange((html, j) => snap(html, `.step-${i}.${j}.html`, dir));
    }
  } finally {
    server.close();
  }
}

/**
 * Applies changes currently and ensures no new changes come in while processing.
 */
async function forEachChange<F extends (html: string, i: number) => unknown>(
  fn: F
) {
  const len = changes.length;
  await Promise.all(changes.map(fn));

  if (len !== changes.length) {
    throw new Error("A mutation occurred when the page should have been idle.");
  }

  changes = [];
}

async function getAvailablePort() {
  return new Promise<number>((resolve) => {
    const server = net.createServer().listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });
}
