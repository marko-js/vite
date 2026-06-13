import { ElementType } from "domelementtype";
import { Comment, DomHandler, Element, Node } from "domhandler";
import { Parser } from "htmlparser2";

import serialize, { InjectType } from "./serializer";

type SerializedOrNull = null | ReturnType<typeof serialize>;
export interface DocManifest {
  preload: string[];
  "head-prepend": SerializedOrNull;
  head: SerializedOrNull;
  "body-prepend": SerializedOrNull;
  body: SerializedOrNull;
}

export interface LinkAssetsDocManifest {
  block: SerializedOrNull;
  defer: SerializedOrNull;
}

const MARKER_COMMENT = "MARKO_VITE";

export function generateDocManifest(
  basePath: string,
  rawHtml: string,
): Promise<DocManifest> {
  return new Promise((resolve, reject) => {
    const parser = new Parser(
      new DomHandler(function (err, dom) {
        if (err) {
          return reject(err);
        }

        const htmlChildren = dom.find(isElement)!.childNodes;
        const preload: string[] = [];
        const headPrepend: Node[] = [];
        const head: Node[] = [];
        const bodyPrepend: Node[] = [];
        const body: Node[] = [];
        splitNodesByMarker(
          (
            htmlChildren.find(
              (node) => isElement(node) && node.tagName === "head",
            ) as Element
          ).childNodes,
          headPrepend,
          head,
        );
        splitNodesByMarker(
          (
            htmlChildren.find(
              (node) => isElement(node) && node.tagName === "body",
            ) as Element
          ).childNodes,
          bodyPrepend,
          body,
        );

        resolve({
          preload,
          "head-prepend": serializeOrNull(basePath, headPrepend, preload),
          head: serializeOrNull(basePath, head, preload),
          "body-prepend": serializeOrNull(basePath, bodyPrepend, preload),
          body: serializeOrNull(basePath, body, preload),
        });
      }),
    );
    parser.write(rawHtml);
    parser.end();
  });
}

/**
 * Like `generateDocManifest`, but for the Marko compiler's built-in asset
 * orchestration where assets are grouped by whether they should be render
 * blocking instead of by document position. Only assets that could cause
 * FOUC (or worse) when delayed are blocking — stylesheets and render
 * blocking scripts are written inline with the html that uses them, while
 * everything else (preloads, async/module scripts) can be injected after
 * the fact (e.g. on a visibility trigger).
 *
 * In dev css is loaded through js modules, so nothing is safe to defer:
 * passing `preventFOUC` (a unique id for the assets being flushed) puts all
 * assets in the render blocking group and prepends parts that hide the page
 * until the document's scripts have been imported. The id scopes the
 * cleanup so independently flushed groups (the page and each lazily loaded
 * template) unhide on their own schedule.
 */
export function generateLinkAssetsManifest(
  basePath: string,
  rawHtml: string,
  preventFOUC?: string,
): Promise<LinkAssetsDocManifest> {
  return new Promise((resolve, reject) => {
    const parser = new Parser(
      new DomHandler(function (err, dom) {
        if (err) {
          return reject(err);
        }

        const htmlChildren = dom.find(isElement)!.childNodes;
        const preload: string[] = [];
        const block: Node[] = [];
        const defer: Node[] = [];

        for (const parent of htmlChildren) {
          if (
            isElement(parent) &&
            (parent.tagName === "head" || parent.tagName === "body")
          ) {
            for (const node of parent.childNodes) {
              if ((node as Comment).data === MARKER_COMMENT) continue;
              (preventFOUC || isBlockingNode(node) ? block : defer).push(node);
            }
          }
        }

        let blockParts = serialize(basePath, block, preload);
        const deferParts = serialize(basePath, defer, preload);

        if (preventFOUC && preload.length) {
          blockParts = getPreventFOUCParts(preload, preventFOUC).concat(
            blockParts,
          );
        }

        resolve({
          block: blockParts.length ? blockParts : null,
          defer: deferParts.length ? deferParts : null,
        });
      }),
    );
    parser.write(rawHtml);
    parser.end();
  });
}

export function getPreventFOUCParts(preload: string[], scopeId: string) {
  const scope = scopeId.replace(/[^a-z0-9_.:-]+/gi, "_");
  const parts: (string | InjectType)[] = [
    `<style marko-vite-preload="${scope}"`,
    InjectType.AssetAttrs,
    `>html{visibility:hidden !important}</style><script marko-vite-preload="${scope}" async blocking=render type=module`,
    InjectType.AssetAttrs,
    ">await Promise.allSettled([",
  ];

  let sep = "";
  for (const id of preload) {
    parts.push(
      `${sep}import("`,
      InjectType.PublicPath,
      `${JSON.stringify(id).slice(1, -1)}")`,
    );
    sep = ",";
  }

  parts.push(
    `]);document.querySelectorAll('[marko-vite-preload="${scope}"]').forEach(el=>el.remove());</script>`,
  );
  return parts;
}

function isBlockingNode(node: Node): boolean {
  if (!isElement(node)) return false;
  switch (node.tagName) {
    case "style":
      return true;
    case "link":
      return node.attribs.rel === "stylesheet";
    case "script": {
      // Scripts are render blocking unless async or deferred (module
      // scripts are implicitly deferred).
      const { attribs } = node;
      return (
        "blocking" in attribs ||
        !("async" in attribs || "defer" in attribs || attribs.type === "module")
      );
    }
    default:
      return false;
  }
}

export function generateInputDoc(entry: string) {
  return `<!DOCTYPE html><html><head><!--${MARKER_COMMENT}--></head><body><!--${MARKER_COMMENT}--><script async type="module" src=${JSON.stringify(
    entry,
  )}></script></body></html>`;
}

function serializeOrNull(basePath: string, nodes: Node[], preload: string[]) {
  const result = serialize(basePath, nodes, preload);
  if (result.length) {
    return result;
  }

  return null;
}

function splitNodesByMarker(nodes: Node[], before: Node[], after: Node[]) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];

    if ((node as Comment).data === MARKER_COMMENT) {
      i++;
      for (; i < nodes.length; i++) {
        node = nodes[i];
        after.push(node);
      }

      break;
    }

    before.push(node);
  }
}

function isElement(node: Node): node is Element {
  return node.type === ElementType.Tag;
}
