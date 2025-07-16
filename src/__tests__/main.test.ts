import { defaultNormalizer, defaultSerializer } from "@marko/fixture-snapshots";
import { diffLines } from "diff";
import { once } from "events";
import fs from "fs";
import type http from "http";
import { JSDOM } from "jsdom";
import snap from "mocha-snap";
import { createRequire } from "module";
import net from "net";
import path from "path";
import * as playwright from "playwright";
import url from "url";

import markoPlugin, { type Options } from "..";

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

type Step = () => Promise<unknown> | unknown;

const requireCwd = createRequire(process.cwd());
let vite: typeof import("vite");
let browser: playwright.Browser;

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

  await context.addInitScript(() => {
    let errorContainer: HTMLElement | null = null;
    window.addEventListener("error", onError);
    document.addEventListener("error", onError, true);

    function onError(evt: ErrorEvent | PromiseRejectionEvent) {
      if (!errorContainer) {
        errorContainer = document.createElement("pre");
        (document.getElementById("app") || document.body).appendChild(
          errorContainer,
        );
      }

      errorContainer.insertAdjacentText(
        "beforeend",
        evt instanceof PromiseRejectionEvent
          ? `${evt.reason}\n`
          : `${evt.error || `Error loading ${(evt.target as any).outerHTML}`}\n`,
      );
    }
  });
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
        const port = await getAvailablePort();
        const server = (
          await import(url.pathToFileURL(path.join(dir, "dev-server.mjs")).href)
        ).default.listen(port) as http.Server;
        try {
          await once(server, "listening");
          await testPage(dir, steps, port);
        } finally {
          server.close();
          await once(server, "close");
        }
      });

      it("build", async () => {
        await vite.build({
          root: dir,
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
          logLevel: "error",
          plugins: [markoPlugin(config.options)],
          build: {
            write: true,
            minify: false,
            assetsInlineLimit: 0,
            emptyOutDir: false, // Avoid server / client deleting files from each other.
          },
        });

        const port = await getAvailablePort();
        const server = (
          await import(url.pathToFileURL(path.join(dir, "server.mjs")).href)
        ).default.listen(port) as http.Server;

        try {
          await once(server, "listening");
          await testPage(dir, steps, port);
        } finally {
          server.close();
          await once(server, "close");
        }
      });
    } else {
      it("dev", async () => {
        const port = await getAvailablePort();
        const devServer = await vite.createServer({
          root: dir,
          server: {
            port,
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

        try {
          await devServer.listen();
          await testPage(dir, steps, port);
        } finally {
          await devServer.close();
        }
      });

      it("build", async () => {
        await vite.build({
          root: dir,
          logLevel: "error",
          plugins: [markoPlugin({ ...config.options, linked: false })],
          build: {
            write: true,
            minify: false,
          },
        });

        const port = await getAvailablePort();
        const previewServer = await vite.preview({
          root: dir,
          server: {
            watch: {
              ignored: [
                "**/node_modules/**",
                "**/dist/**",
                "**/__snapshots__/**",
              ],
            },
          },
          preview: { port },
        });

        try {
          await testPage(dir, steps, port);
        } finally {
          await previewServer.close();
        }
      });
    }
  });
}

async function testPage(dir: string, steps: Step[], port: number) {
  await waitForPendingRequests(page, () =>
    page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" }),
  );

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

  let snapshot = "";
  let prevHtml: string | undefined;

  await page.waitForSelector("#app");

  snapshot += `# Loading\n\n`;
  const html = await getHTML();
  snapshot += htmlSnapshot(html, prevHtml);
  prevHtml = html;

  for (const [i, step] of steps.entries()) {
    await waitForPendingRequests(page, step);
    snapshot += `# Step ${i}\n${getStepString(step)}\n\n`;
    const html = await getHTML();
    if (html === prevHtml) continue;
    snapshot += htmlSnapshot(html, prevHtml);
    prevHtml = html;
  }

  await snap(snapshot, { ext: ".md", dir });
}

/**
 * Applies changes currently and ensures no new changes come in while processing.
 */
async function getHTML() {
  return defaultSerializer(
    defaultNormalizer(
      JSDOM.fragment(
        await page.evaluate(
          () => (document.getElementById("app") || document.body).innerHTML,
        ),
      ),
    ),
  )
    .replace(/-[a-z0-9_-]+(\.\w+)/gi, "-[hash]$1")
    .replace(/[?&][tv]=[\d.]+/, "");
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
    if (!--remaining) {
      await new Promise((r) => setTimeout(r, 500));
      if (!remaining) {
        resolve();
      }
    }
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

function getStepString(step: Step) {
  return step
    .toString()
    .replace(/^.*?{\s*([\s\S]*?)\s*}.*?$/, "$1")
    .replace(/^ {4}/gm, "")
    .replace(/;$/, "");
}

function htmlSnapshot(html: string, prevHtml?: string) {
  if (prevHtml) {
    const diff = diffLines(prevHtml, html)
      .map((part) =>
        part.added ? `+${part.value}` : part.removed ? `-${part.value}` : "",
      )
      .filter(Boolean)
      .join("");
    return `\`\`\`diff\n${diff}\n\`\`\`\n\n`;
  }
  return `\`\`\`html\n${html}\n\`\`\`\n\n`;
}
