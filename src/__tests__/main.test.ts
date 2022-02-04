import type { AddressInfo } from "net";

import fs from "fs";
import http from "http";
import path from "path";
import cp from "child_process";
import timers from "timers/promises";
import snap from "mocha-snap";
import { JSDOM } from "jsdom";
import * as playwright from "playwright";
import { defaultNormalizer, defaultSerializer } from "@marko/fixture-snapshots";

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
let proc: cp.ChildProcess;

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

afterEach(() => {
  if (proc) {
    proc.unref();
    proc.kill();
  }
});
after(async () => await browser.close());

const FIXTURES = path.join(__dirname, "fixtures");

for (const fixture of fs.readdirSync(FIXTURES)) {
  describe(fixture, () => {
    const dir = path.join(FIXTURES, fixture);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(path.join(dir, "test.config.ts")) as {
      steps?: Step | Step[];
    };
    const steps: Step[] = config.steps
      ? Array.isArray(config.steps)
        ? config.steps
        : [config.steps]
      : [];

    it("dev", async () => {
      const port = await getAvailablePort();
      proc = cp.spawn("npm", ["run", "dev"], {
        cwd: dir,
        // stdio: "inherit",
        shell: process.env.SHELL,
        env: { ...process.env, PORT: `${port}` },
      });

      await testPage(dir, steps, port);
    });

    it("build", async () => {
      const port = await getAvailablePort();
      proc = cp.spawn("npm", ["run", "start"], {
        cwd: dir,
        // stdio: "inherit",
        shell: process.env.SHELL,
        env: { ...process.env, PORT: `${port}`, NODE_ENV: "production" },
      });

      await testPage(dir, steps, port);
    });
  });
}

async function testPage(dir: string, steps: Step[], port: number) {
  const href = `http://localhost:${port}`;
  await waitForAddress(href);
  await page.goto(href, { waitUntil: "networkidle" });
  await page.waitForSelector("#app");
  await forEachChange((html, i) => snap(html, `.loading.${i}.html`, dir));

  for (const [i, step] of steps.entries()) {
    await step();
    await forEachChange((html, j) => snap(html, `.step-${i}.${j}.html`, dir));
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

function waitForAddress(href: string) {
  let tries = 20;
  return new Promise<void>(function check(resolve, reject) {
    http
      .get(
        href,
        {
          headers: {
            Accept: "text/html",
          },
        },
        (res) => {
          if (res.statusCode === 200) resolve();
          else retry();
          res.destroy();
        }
      )
      .once("error", retry);

    function retry() {
      if (--tries) setTimeout(check, 500, resolve, reject);
      else reject(new Error(`Timeout connecting to ${href}`));
    }
  });
}

async function getAvailablePort() {
  return new Promise<number>((resolve) => {
    const server = http
      .createServer()
      .unref()
      .listen(0, () => {
        const { port } = server.address() as AddressInfo;
        server.close(() => resolve(port));
      });
  });
}
