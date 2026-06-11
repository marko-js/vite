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
import url from "url";

import markoPlugin, { type Options } from "..";
import { type Browser, fromURL } from "./utils/create-browser";
import injectHmrEventsPlugin from "./utils/inject-hmr-events-plugin";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

declare global {
  var browser: Browser;
  interface Window {
    __nextHmr?: Promise<void>;
  }
}

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
let browser: Browser;

before(async () => {
  vite = await import("vite");
});

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

    const steps = toSteps(config.steps);

    if (config.ssr) {
      it("dev", async () => {
        const server = (
          await import(url.pathToFileURL(path.join(dir, "dev-server.mjs")).href)
        ).default.listen(0) as http.Server;
        try {
          await once(server, "listening");
          await testPage(dir, steps, getPort(server));
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

        const server = (
          await import(url.pathToFileURL(path.join(dir, "server.mjs")).href)
        ).default.listen(0) as http.Server;

        try {
          await once(server, "listening");
          await testPage(dir, steps, getPort(server));
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
        const devServer = await vite.createServer({
          root: dir,
          server: {
            port: 0,
            hmr: false,
            watch: null,
          },
          logLevel: "error",
          optimizeDeps: { force: true },
          plugins: [markoPlugin({ ...config.options, linked: false })],
        });

        try {
          await devServer.listen();
          await testPage(dir, steps, getPort(devServer.httpServer!));
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
          preview: { port: 0 },
        });

        try {
          await testPage(dir, steps, getPort(previewServer.httpServer));
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
  const originalFiles = new Map<string, string>();

  const devServer = await vite.createServer({
    root: dir,
    mode: "development",
    appType: "custom",
    logLevel: "error",
    plugins: [markoPlugin(config.options), injectHmrEventsPlugin()],
    optimizeDeps: { force: true },
    server: {
      port: 0,
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

  try {
    await devServer.listen();
    const port = getPort(devServer.httpServer!);
    await openPage(port);

    let snapshot = "";
    let prevHtml: string | undefined;
    let prevRawHtml: string | undefined;

    snapshot += `# Loading\n\n`;
    const initialHtml = getHTML();
    prevRawHtml = getRawHTML();
    snapshot += htmlSnapshot(initialHtml, prevHtml);
    prevHtml = initialHtml;

    for (const [i, step] of toSteps(config.steps).entries()) {
      snapshot += `# Step ${i}\n${getStepString(step)}\n\n`;
      await step();
      await browser.drain();
      const stepHtml = getHTML();
      if (stepHtml === prevHtml) continue;
      snapshot += htmlSnapshot(stepHtml, prevHtml);
      prevHtml = stepHtml;
      prevRawHtml = getRawHTML();
    }

    let prevReloadCount = browser.reloadCount;

    for (const [hmrIdx, hmrStep] of hmrSteps.entries()) {
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

      await Promise.any([
        // If the client entry hasn't installed __nextHmr, never settle so the
        // waitFor below is the only signal (Promise.any would otherwise treat
        // undefined as an immediately fulfilled value).
        browser.window.__nextHmr ?? new Promise<never>(() => {}),
        waitFor(
          () =>
            getRawHTML() !== prevRawHtml ||
            browser.reloadCount !== prevReloadCount,
        ),
      ]);

      // Vite debounces full-page reloads by 20ms after vite:afterUpdate.
      // Sleep longer than the debounce before reading reloadCount.
      await sleep(50);
      await browser.drain();

      const hmrReloads = browser.reloadCount - prevReloadCount;
      if (hmrReloads) {
        // JSDOM can't navigate, so simulate the reload by re-opening the page
        // to capture the freshly server-rendered result.
        await openPage(port);
      }
      prevReloadCount = browser.reloadCount;

      const hmrHtml = getHTML();
      const changesDesc = hmrStep.changes
        .map(
          ([file, find, replace]) =>
            `${file}: ${JSON.stringify(find)} → ${JSON.stringify(replace)}`,
        )
        .join("\n");

      snapshot += `# HMR ${hmrIdx}`;

      if (hmrReloads) {
        snapshot += ` (Reload${hmrReloads > 1 ? ` x${hmrReloads}` : ""})`;
      } else {
        snapshot += ` (No Reload)`;
      }

      snapshot += `\n${changesDesc}\n\n`;

      if (hmrHtml !== prevHtml) {
        snapshot += htmlSnapshot(hmrHtml, prevHtml);
        prevHtml = hmrHtml;
        prevRawHtml = getRawHTML();
      } else {
        snapshot += `(no change)\n\n`;
      }

      for (const [i, step] of toSteps(hmrStep.steps).entries()) {
        snapshot += `# HMR ${hmrIdx} Step ${i}\n${getStepString(step)}\n\n`;
        await step();
        await browser.drain();
        const stepHtml = getHTML();
        if (stepHtml === prevHtml) continue;
        snapshot += htmlSnapshot(stepHtml, prevHtml);
        prevHtml = stepHtml;
        prevRawHtml = getRawHTML();
      }
    }

    await snap(snapshot, { ext: ".md", dir });
  } finally {
    // Close the page before the server so the Vite client's reconnect
    // polling (which assumes a restarting dev server) can't keep running
    // against the closed port.
    globalThis.browser?.window.close();
    for (const [filePath, content] of originalFiles) {
      fs.writeFileSync(filePath, content);
    }
    await devServer.close();
  }
}

async function testPage(dir: string, steps: Step[], port: number) {
  try {
    await openPage(port);

    let snapshot = "";
    let prevHtml: string | undefined;

    snapshot += `# Loading\n\n`;
    const initialHtml = getHTML();
    snapshot += htmlSnapshot(initialHtml, prevHtml);
    prevHtml = initialHtml;

    for (const [i, step] of steps.entries()) {
      snapshot += `# Step ${i}\n${getStepString(step)}\n\n`;
      await step();
      await browser.drain();
      const html = getHTML();
      if (html === prevHtml) continue;
      snapshot += htmlSnapshot(html, prevHtml);
      prevHtml = html;
    }

    await snap(snapshot, { ext: ".md", dir });
  } finally {
    // Close the page before the caller closes its server, so the Vite
    // client's reconnect polling can't keep running against the closed port.
    globalThis.browser?.window.close();
  }
}

async function openPage(port: number): Promise<void> {
  globalThis.browser?.window.close();
  browser = globalThis.browser = await fromURL(`http://localhost:${port}`);
  while (browser.flush()) {
    // Apply every server flush; tests that assert intermediate streamed
    // states can instead step through flushes one at a time.
  }
  await browser.settle();
  await browser.drain();

  const { document } = browser.window;
  if (document.title === "Error") {
    const pre = document.querySelector("pre");
    const error = new Error("Error in response");
    if (pre) {
      error.stack = JSDOM.fragment(
        pre.innerHTML.replace(/<br>/g, "\n"),
      ).textContent!;
    }
    throw error;
  }
  if (!document.getElementById("app")) {
    throw new Error("No #app element found");
  }
}

function toSteps(steps?: Step | Step[]): Step[] {
  return steps == null ? [] : Array.isArray(steps) ? steps : [steps];
}

function getHTML() {
  return defaultSerializer(
    defaultNormalizer(
      JSDOM.fragment(
        browser.window.document.getElementById("app")?.innerHTML || "",
      ),
    ),
  )
    .replace(/\/_[a-z0-9_-]+(\.\w+)/gi, "/[hash]$1")
    .replace(/-[a-z0-9_-]+(\.\w+)/gi, "-[hash]$1")
    .replace(/[?&][tv]=[\d.]+/, "");
}

function getRawHTML() {
  return browser.window.document.getElementById("app")?.innerHTML || "";
}

function getPort(server: Pick<net.Server, "address">) {
  // Servers are always started on port 0 — the kernel assigns a free port
  // atomically, unlike probing for one (which races against other sockets,
  // including this process's own outgoing connections).
  return (server.address() as net.AddressInfo).port;
}

async function waitFor(fn: () => boolean, timeout = 5000): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (fn()) return;
    await sleep(50);
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
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
