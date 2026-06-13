import vm from "node:vm";

import { JSDOM, VirtualConsole } from "jsdom";

/**
 * Local test servers can abort individual requests (Vite responds 504 while
 * its dep optimizer re-bundles, and connection teardown can reset an
 * in-flight socket). A real browser recovers via the Vite client's
 * reload/retry; the harness equivalent for these idempotent GETs is a short
 * bounded retry.
 */
async function fetchRetry(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status !== 504 || attempt >= 2) return res;
    } catch (err) {
      if (attempt >= 2) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
  }
}

// The Vite client running in the page is chatty ("[vite] connecting...",
// hot update notices, reconnect polling). Drop its prefixed logs and forward
// everything else (fixture logging, real errors) to the real console.
const quietConsole: Console = { ...console };
for (const [key, fn] of Object.entries(console)) {
  if (typeof fn === "function") {
    (quietConsole as any)[key] = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].startsWith("[vite]")) return;
      fn.apply(console, args);
    };
  }
}

export interface Browser {
  window: Window & typeof globalThis;
  /** Cumulative count of location.reload() calls. */
  readonly reloadCount: number;
  /** Applies streamed HTML up to the next server flush; true if more remains. */
  flush(): boolean;
  /** Waits for external resources to load and evaluates flushed module scripts. */
  settle(): Promise<void>;
  /** Waits for scheduled renders (microtasks, rAF, postMessage) to settle. */
  drain(): Promise<void>;
}

export async function fromURL(url: string): Promise<Browser> {
  const chunks = await fetchChunks(url);
  const errors: Error[] = [];
  let reloadCount = 0;
  let pendingFetches = 0;
  let completedFetches = 0;
  let rafBatch: Map<number, FrameRequestCallback> | undefined;
  let rafId = 0;

  function flushFrame() {
    const batch = rafBatch;
    if (!batch?.size) return false;
    rafBatch = undefined;
    const now = window.performance.now();
    for (const cb of batch.values()) cb(now);
    return true;
  }

  const virtualConsole = new VirtualConsole();
  virtualConsole.forwardTo(quietConsole, {
    jsdomErrors: ["css-parsing", "resource-loading"],
  });
  virtualConsole.on("jsdomError", (err) => {
    const { type, cause } = err as Error & { type?: string; cause?: unknown };
    if (err.message === "Not implemented: navigation to another Document") {
      // location.reload() is non-configurable in JSDOM, so we can't observe
      // it directly. JSDOM emits a jsdomError when navigation is attempted,
      // so we count those instead.
      reloadCount++;
    } else if (
      type === "unhandled-exception" &&
      !/WebSocket closed/i.test(`${err.message} ${cause}`)
    ) {
      errors.push(cause instanceof Error ? cause : err);
    }
  });

  const dom = new JSDOM("", {
    url,
    resources: "usable",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      (window as any).__name = (v: any) => v; // needed for esbuild.
      window.setImmediate = setImmediate;
      // Node's MessageChannel delivers on its own task source, which can
      // land between drain() ticks and hide a scheduled update from its
      // quiet check. Like the marko test runner, deliver via setImmediate →
      // queueMicrotask so messages always run before the next tick's check.
      window.MessageChannel = class MessageChannel {
        port1: any = { onmessage() {} };
        port2: any = {
          postMessage: () => {
            setImmediate(() => {
              window.queueMicrotask(() => this.port1.onmessage());
            });
          },
        };
      } as any;
      window.WebSocket = globalThis.WebSocket;
      // JSDOM paces requestAnimationFrame on a real ~16ms frame timer; tests
      // only need the scheduling semantics, so frames are collected into a
      // batch that drain() delivers explicitly (callbacks scheduled during a
      // flush land in the next batch, like real frames). Owning the queue
      // lets drain() settle by queue emptiness instead of guessing whether
      // scheduled work is still pending.
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
        (rafBatch ??= new Map()).set(++rafId, cb);
        return rafId;
      }) as typeof requestAnimationFrame;
      window.cancelAnimationFrame = ((handle: number) =>
        rafBatch?.delete(handle)) as typeof cancelAnimationFrame;
      // Node's fetch rejects relative URLs; resolve them against the page.
      // Requests are also tracked so drain() doesn't report a stable DOM
      // while a response (and any update it causes) is still in flight.
      window.fetch = ((input: any, init?: any) => {
        const res = globalThis.fetch(
          typeof input === "object" && typeof input.url === "string"
            ? input
            : new URL(input, url),
          init,
        );
        const done = () => {
          pendingFetches--;
          completedFetches++;
        };
        pendingFetches++;
        res.then((r) => r.clone().arrayBuffer().then(done, done), done);
        return res;
      }) as typeof fetch;
    },
  });

  const window = dom.window as unknown as Browser["window"];
  const { document } = window;

  // JSDOM cannot parse incrementally (document.write() tokenizes each call
  // separately, mangling content that spans calls), so all chunks are joined
  // with comment markers and parsed at once. DOMParser is used (rather than
  // JSDOM.fragment(), which parses in a <template> context) so the
  // full-document structure — doctype, auto-placed <head>/<body> content —
  // is preserved, and the document inherits the page URL for src/href
  // resolution. The markers survive as Comment nodes, and flush() replays
  // the parsed DOM into the live document chunk by chunk — executing scripts
  // at their streamed positions like a browser.
  const parsed = new window.DOMParser().parseFromString(
    chunks.join("<!--%%FLUSH%%-->"),
    "text/html",
  );

  // Map structural nodes so flush() reuses the existing elements instead of
  // trying to re-append <html>/<head>/<body> to a document that already has
  // them.
  const targetNodes = new WeakMap<Node, Node>([[parsed, document]]);
  if (parsed.doctype) targetNodes.set(parsed.doctype, document);
  targetNodes.set(parsed.documentElement, document.documentElement);
  targetNodes.set(parsed.head, document.head);
  targetNodes.set(parsed.body, document.body);

  let mutated = false;
  const mutationObserver = new window.MutationObserver(() => {
    mutated = true;
  });
  mutationObserver.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  const walker = parsed.createTreeWalker(parsed);
  const vmContext = dom.getInternalVMContext();
  const moduleCache = new Map<string, Promise<vm.Module>>();
  const pendingModules: Promise<vm.Module>[] = [];
  const pendingResources: Promise<unknown>[] = [];
  const handledScripts = new WeakSet<HTMLScriptElement>();
  let inlineModuleCount = 0;

  // Module scripts can also enter the DOM after streaming (e.g. a lazy
  // load trigger inserting its assets when its event fires). JSDOM won't
  // evaluate them, so drain() scans for unhandled ones and runs them like
  // the marko test runner re-scans `document.scripts`.
  async function evalNewScripts() {
    let ran = false;
    for (const script of [...document.scripts]) {
      if (
        script.type === "module" &&
        script.src &&
        !handledScripts.has(script)
      ) {
        handledScripts.add(script);
        ran = true;
        const mod = await loadModule(script.src);
        await mod.evaluate();
      }
    }
    return ran;
  }

  function loadModule(moduleUrl: string): Promise<vm.Module> {
    let mod = moduleCache.get(moduleUrl);
    if (!mod) {
      // Counted with page requests so drain() doesn't report a stable DOM
      // while a module (e.g. a lazy load entry's fire-and-forget import of
      // its template) is still being fetched and linked.
      const done = () => {
        pendingFetches--;
        completedFetches++;
      };
      pendingFetches++;
      moduleCache.set(
        moduleUrl,
        (mod = fetchRetry(moduleUrl)
          .then((res) => {
            if (!res.ok) {
              throw new Error(
                `Failed to load module (${res.status}): ${moduleUrl}`,
              );
            }
            return res.text();
          })
          .then((source) => createModule(source, moduleUrl))),
      );
      mod.then(done, done);
    }
    return mod;
  }

  async function createModule(source: string, identifier: string) {
    const mod = new vm.SourceTextModule(source, {
      context: vmContext,
      identifier,
      initializeImportMeta(meta) {
        meta.url = identifier;
      },
      importModuleDynamically: async (specifier, parent) => {
        const child = await linker(specifier, parent);
        if (child.status === "linked") await child.evaluate();
        return child;
      },
    });
    await mod.link(linker);
    return mod;
  }

  function linker(specifier: string, parent: vm.Module) {
    return loadModule(new URL(specifier, parent.identifier).href);
  }

  return {
    window,
    get reloadCount() {
      return reloadCount;
    },
    flush() {
      let node: Node | null;
      while ((node = walker.nextNode())) {
        // Each %%FLUSH%% comment marks a chunk boundary — stop here and
        // signal that more content is available via the next flush() call.
        if (isComment(node) && node.data === "%%FLUSH%%") return true;

        // Structural nodes are pre-mapped — skip them, traverse into children.
        if (targetNodes.has(node)) continue;

        let clone: Node;
        if (isScript(node)) {
          if (node.type === "module") {
            // JSDOM doesn't support ES modules, so start loading through
            // vm.SourceTextModule (evaluated in document order by settle(),
            // like a browser evaluates module scripts after parsing) and keep
            // an inert copy in the DOM — importNode copies the node without
            // executing it (a JSDOM limitation we rely on here).
            pendingModules.push(
              node.src
                ? loadModule(node.src)
                : createModule(
                    node.text,
                    `${url}#inline${inlineModuleCount++}`,
                  ),
            );
            clone = document.importNode(node, true);
            handledScripts.add(clone as HTMLScriptElement);
          } else {
            // Unlike imported nodes, fresh script elements execute on
            // insertion via JSDOM's _attach() → _eval().
            const script = document.createElement("script");
            for (const { name, value } of node.attributes) {
              script.setAttribute(name, value);
            }
            if (!script.src) script.text = node.text;
            clone = script;
          }
        } else {
          clone = document.importNode(node, isStyle(node));
        }

        if (isLoadable(clone)) {
          pendingResources.push(
            new Promise((resolve) => {
              clone.onload = clone.onerror = resolve;
            }),
          );
        }

        targetNodes.set(node, clone);
        (targetNodes.get(node.parentNode!) as ParentNode).appendChild(clone);

        // Scripts and styles were copied with their text content included;
        // skip the already-handled child so it isn't processed again.
        if ((isScript(node) || isStyle(node)) && node.hasChildNodes()) {
          walker.nextNode();
        }
      }
      return false;
    },
    async settle() {
      await Promise.all(pendingResources.splice(0));
      // Like the marko test runner, scheduled effects (hydration renders)
      // are deferred while module scripts evaluate and applied together
      // after, so the page reaches the same state no matter how evaluation
      // interleaves with the runtime's scheduling.
      const qmt = window.queueMicrotask;
      const deferred: Array<() => void> = [];
      window.queueMicrotask = (cb) => {
        deferred.push(cb);
      };
      try {
        for (const mod of await Promise.all(pendingModules.splice(0))) {
          await mod.evaluate();
        }
      } finally {
        window.queueMicrotask = qmt;
      }
      for (const cb of deferred) qmt.call(window, cb);
    },
    async drain() {
      // Marko schedules DOM updates via queueMicrotask, then a frame, then a
      // message port macrotask (and the class API via postMessage). Each
      // tick crosses a timer AND an immediate boundary — covering every
      // event loop phase work can be scheduled into, including the message
      // deliveries stubbed onto setImmediate above — and then delivers a
      // frame from the owned rAF queue. The loop only settles after two
      // consecutive ticks ran no frame callbacks, saw no DOM mutations, and
      // had no request in flight: work can be parked (e.g. in JSDOM's own
      // event loop) where a single quiet tick can't observe it.
      for (let i = 0, quietTicks = 0; i < 50; i++) {
        const fetches = completedFetches;
        mutated = false;
        await new Promise((resolve) => setTimeout(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        const ranFrame = flushFrame();
        const ranScript = await evalNewScripts();
        if (errors.length) throw errors.splice(0, errors.length)[0];
        // A request that's in flight (or finished mid-tick) may still cause
        // an update; only an unmutated DOM across a quiet tick is stable.
        if (
          !ranFrame &&
          !ranScript &&
          !mutated &&
          !mutationObserver.takeRecords().length &&
          !pendingFetches &&
          fetches === completedFetches
        ) {
          if (++quietTicks === 2) return;
        } else {
          quietTicks = 0;
        }
      }
    },
  };
}

async function fetchChunks(url: string): Promise<string[]> {
  const chunks: string[] = [];
  const decoder = new TextDecoder();
  const reader = (await fetchRetry(url)).body!.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // A network read can end anywhere — even mid-tag, where the joined
    // %%FLUSH%% marker would corrupt the HTML. Only treat reads that end at a
    // tag boundary (outside scripts, styles, and comments) as server flushes;
    // anything else is merged into the next chunk.
    if (isChunkBoundary(buffer)) {
      chunks.push(buffer);
      buffer = "";
    }
  }

  buffer += decoder.decode();
  if (buffer) chunks.push(buffer);

  return chunks;
}

function isChunkBoundary(html: string) {
  return (
    /<\/?[a-z][^<]*>\s*$/i.test(html) &&
    countMatches(html, /<script[\s>]/g) === countMatches(html, /<\/script>/g) &&
    countMatches(html, /<style[\s>]/g) === countMatches(html, /<\/style>/g) &&
    countMatches(html, /<!--/g) === countMatches(html, /-->/g)
  );
}

function countMatches(html: string, pattern: RegExp) {
  return html.match(pattern)?.length ?? 0;
}

function isScript(node: Node): node is HTMLScriptElement {
  return (node as Element).tagName === "SCRIPT";
}

function isStyle(node: Node): node is HTMLStyleElement {
  return (node as Element).tagName === "STYLE";
}

function isComment(node: Node): node is Comment {
  return node.nodeType === 8; /* Node.COMMENT_NODE */
}

function isLoadable(node: Node): node is HTMLLinkElement | HTMLScriptElement {
  return isScript(node)
    ? !!node.src && node.type !== "module"
    : (node as Element).tagName === "LINK" &&
        (node as HTMLLinkElement).rel === "stylesheet" &&
        !!(node as HTMLLinkElement).href;
}
