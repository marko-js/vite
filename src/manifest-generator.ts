import { ElementType } from "domelementtype";
import { Comment, DomHandler, Element, Node } from "domhandler";
import { Parser } from "htmlparser2";

import serialize from "./serializer";

type SerializedOrNull = null | ReturnType<typeof serialize>;
export interface DocManifest {
  preload: string[];
  "head-prepend": SerializedOrNull;
  head: SerializedOrNull;
  "body-prepend": SerializedOrNull;
  body: SerializedOrNull;
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
