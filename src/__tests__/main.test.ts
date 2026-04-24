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
import injectHmrEventsPlugin from "./utils/inject-hmr-events-plugin";

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

declare let __loading__: Promise<void> | undefined;

type Step = () => Promise<unknown> | unknown;
type HMRChange = [file: string, find: string, replace: string];
type HMRStep = { changes: HMRChange[]; steps?: Step | Step[] };

interface FixtureConfig {
  ssr: boolean;
  steps?: Step | Step[];
  hmr?: HMRStep[];
  options?: Options;
  env?: Record<string, string>;
}

const requireCwd = createRequire(process.cwd());
let vite: typeof import("vite");
let browser: playwright.Browser;

before(async () => {
  vite = await import("vite");
  browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  context.on("console", (msg) => console.log(`[${msg.type()}] ${msg.text()}`));
  await context.addInitScript(() => {
    // needed for esbuild.
    (window as any).__name = (v: any) => v;
    __loading__ = undefined;

    const seen = new Set<string>();
    let remaining = 0;
    let resolve: undefined | (() => void);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    onMutate(document, (_, obs) => {
      if (!document.body) return;
      obs.disconnect();
      trackAssets();
      onMutate(document.body, trackAssets);
    });

    function onMutate(target: Node, fn: MutationCallback) {
      new MutationObserver(fn).observe(target, {
        childList: true,
        subtree: true,
      });
    }
    function trackAssets() {
      for (const el of document.querySelectorAll<
        HTMLScriptElement | HTMLLinkElement
      >("script[src],link[rel=stylesheet][href]")) {
        const href = "src" in el ? el.src : el.href;
        if (href && !seen.has(href)) {
          const link = document.createElement("link");
          __loading__ ||= new Promise((r) => (resolve = r));
          seen.add(href);
          remaining++;

          if ("src" in el) {
            if (el.getAttribute("type") === "module") {
              link.rel = "modulepreload";
            } else {
              link.rel = "preload";
              link.as = "script";
            }
          } else {
            link.rel = "preload";
            link.as = "style";
          }

          link.href = href;
          link.onload = link.onerror = () => {
            link.onload = link.onerror = null;
            link.remove();
            seen.delete(href);
            if (!--remaining) {
              resolve?.();
              resolve = __loading__ = undefined;
            }
          };
          document.head.append(link);
        }
      }
    }
    function onError(ev: ErrorEvent | PromiseRejectionEvent) {
      const msg =
        ev instanceof PromiseRejectionEvent
          ? `${ev.reason}\n`
          : `${ev.error || `Error loading ${(ev.target as any).outerHTML}`}\n`;
      if (!msg.includes("WebSocket closed")) {
        let errorContainer = document.getElementById("error");
        if (!errorContainer) {
          errorContainer = document.createElement("pre");
          errorContainer.id = "error";
          (document.getElementById("app") || document.body).appendChild(
            errorContainer,
          );
        }
        errorContainer.insertAdjacentText("beforeend", msg);
      }
    }
  });

  globalThis.page = await context.newPage();
});

after(() => browser.close());

const FIXTURES = path.join(__dirname, "fixtures");

for (const fixture of fs.readdirSync(FIXTURES)) {
  describe(fixture, () => {
    const dir = path.join(FIXTURES, fixture);
    const config = requireCwd(
      path.join(dir, "test.config.ts"),
    ) as FixtureConfig;

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
        }
      });

      if (config.hmr) {
        it("dev (hmr)", async () => {
          await testHMR(dir, config);
        });
      }
    } else {
      it("dev", async () => {
        const port = await getAvailablePort();
        const devServer = await vite.createServer({
          root: dir,
          server: {
            port,
            hmr: false,
            watch: null,
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

      if (config.hmr) {
        it("dev (hmr)", async () => {
          await testHMR(dir, config);
        });
      }
    }
  });
}

async function testHMR(dir: string, config: FixtureConfig) {
  const hmrSteps = config.hmr!;
  const port = await getAvailablePort();
  const originalFiles = new Map<string, string>();

  // Create a dev server with HMR enabled.
  // We use mode "development" (not "test") so the plugin enables HMR features
  // (hot compiler flag, import.meta.hot.accept injection).
  const devServer = await vite.createServer({
    root: dir,
    mode: "development",
    appType: "custom",
    logLevel: "error",
    plugins: [markoPlugin(config.options), injectHmrEventsPlugin()],
    optimizeDeps: { force: true },
    server: {
      port,
      hmr: true,
      watch: {
        ignored: ["**/node_modules/**", "**/dist/**", "**/__snapshots__/**"],
      },
    },
    build: {
      assetsInlineLimit: 0,
    },
  });

  if (config.ssr) {
    // For SSR fixtures, add middleware that handles SSR rendering.
    devServer.middlewares.use(async (req, res, next) => {
      try {
        const { handler } = await devServer.ssrLoadModule(
          path.join(dir, "./src/index.js"),
        );
        await handler(req, res, next);
      } catch (err: any) {
        devServer.ssrFixStacktrace(err);
        return next(err);
      }
    });
  }

  let hmrReloads = 0;
  function trackReloads() {
    hmrReloads++;
  }

  try {
    await devServer.listen();

    // Navigate to the page and capture initial state.
    await page.goto(`http://localhost:${port}`);

    const title = await page.title();
    if (title === "Error") {
      const error = new Error("Error in response");
      const html = await page.locator("pre").innerHTML();
      if (html) {
        error.stack = JSDOM.fragment(html.replace(/<br>/g, "\n")).textContent!;
      }
      throw error;
    }

    let snapshot = "";
    let prevHtml: string | undefined;
    let prevRawHtml: string | undefined;

    await page.waitForSelector("#app");
    snapshot += `# Loading\n\n`;
    const html = await getHTML();
    prevRawHtml = await getRawHTML();
    snapshot += htmlSnapshot(html, prevHtml);
    prevHtml = html;

    // Run initial interaction steps if provided at top-level.
    const initialSteps: Step[] = config.steps
      ? Array.isArray(config.steps)
        ? config.steps
        : [config.steps]
      : [];

    for (const [i, step] of initialSteps.entries()) {
      snapshot += `# Step ${i}\n${getStepString(step)}\n\n`;
      await step();
      const stepHtml = await getHTML();
      if (stepHtml === prevHtml) continue;
      snapshot += htmlSnapshot(stepHtml, prevHtml);
      prevHtml = stepHtml;
      prevRawHtml = await getRawHTML();
    }

    page.on("framenavigated", trackReloads);

    // Run HMR steps.
    for (const [hmrIdx, hmrStep] of hmrSteps.entries()) {
      // Apply file changes.
      for (const [file, find, replace] of hmrStep.changes) {
        const filePath = path.join(dir, file);
        if (!originalFiles.has(filePath)) {
          originalFiles.set(filePath, fs.readFileSync(filePath, "utf8"));
        }
        const content = fs.readFileSync(filePath, "utf8");
        const newContent = content.replace(find, replace);
        if (newContent === content) {
          throw new Error(
            `HMR change failed: could not find ${JSON.stringify(find)} in ${file}`,
          );
        }
        fs.writeFileSync(filePath, newContent);
      }

      // // Wait for HMR update to propagate to the browser.
      // // We listen for Vite HMR events and watch for DOM changes on #app as a signal that HMR has taken effect.

      await Promise.any([
        page.evaluate(() => (window as any).__nextHmr),
        page
          .waitForFunction(
            (prev) => {
              const app = document.getElementById("app");
              return app && app.innerHTML !== prev;
            },
            prevRawHtml,
            { timeout: 5000 },
          )
          .catch(() => {
            /* Timeout */
          }),
      ]);

      await page.waitForTimeout(100);

      const hmrHtml = await getHTML();
      const changesDesc = hmrStep.changes
        .map(
          ([file, find, replace]) =>
            `${file}: ${JSON.stringify(find)} → ${JSON.stringify(replace)}`,
        )
        .join("\n");

      snapshot += `# HMR ${hmrIdx}`;

      if (hmrReloads) {
        snapshot += ` (Reload${hmrReloads > 1 ? ` x${hmrReloads}` : ""})`;
        hmrReloads = 0;
      } else {
        snapshot += ` (No Reload)`;
      }

      snapshot += `\n${changesDesc}\n\n`;

      if (hmrHtml !== prevHtml) {
        snapshot += htmlSnapshot(hmrHtml, prevHtml);
        prevHtml = hmrHtml;
        prevRawHtml = await getRawHTML();
      } else {
        snapshot += `(no change)\n\n`;
      }

      // Run any post-HMR interaction steps.
      const postSteps: Step[] = hmrStep.steps
        ? Array.isArray(hmrStep.steps)
          ? hmrStep.steps
          : [hmrStep.steps]
        : [];

      for (const [i, step] of postSteps.entries()) {
        snapshot += `# HMR ${hmrIdx} Step ${i}\n${getStepString(step)}\n\n`;
        await step();
        const stepHtml = await getHTML();
        if (stepHtml === prevHtml) continue;
        snapshot += htmlSnapshot(stepHtml, prevHtml);
        prevHtml = stepHtml;
        prevRawHtml = await getRawHTML();
      }
    }

    await snap(snapshot, { ext: ".md", dir });
  } finally {
    // Restore all mutated files.
    for (const [filePath, content] of originalFiles) {
      fs.writeFileSync(filePath, content);
    }
    page.off("framenavigated", trackReloads);

    await devServer.close();
  }
}

async function testPage(dir: string, steps: Step[], port: number) {
  await page.goto(`http://localhost:${port}`);

  const title = await page.title();
  if (title === "Error") {
    const error = new Error("Error in response");
    const html = await page.locator("pre").innerHTML();
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
    snapshot += `# Step ${i}\n${getStepString(step)}\n\n`;
    await step();
    const html = await getHTML();
    if (html === prevHtml) continue;
    snapshot += htmlSnapshot(html, prevHtml);
    prevHtml = html;
  }

  await snap(snapshot, { ext: ".md", dir });
}

async function getHTML() {
  return defaultSerializer(
    defaultNormalizer(
      JSDOM.fragment(
        await page.evaluate(async () => {
          do {
            await __loading__;
            await new Promise((r) => {
              requestAnimationFrame(() => {
                const { port1, port2 } = new MessageChannel();
                port1.onmessage = r;
                port2.postMessage(0);
              });
            });
          } while (__loading__);

          return document.getElementById("app")?.innerHTML || "";
        }),
      ),
    ),
  )
    .replace(/\/_[a-z0-9_-]+(\.\w+)/gi, "/[hash]$1")
    .replace(/-[a-z0-9_-]+(\.\w+)/gi, "-[hash]$1")
    .replace(/[?&][tv]=[\d.]+/, "");
}

async function getRawHTML() {
  return page.evaluate(() => document.getElementById("app")?.innerHTML || "");
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
