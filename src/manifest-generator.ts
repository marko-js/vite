import { Parser } from "htmlparser2";
import { ElementType } from "domelementtype";
import { DomHandler, Element, Comment, Node } from "domhandler";
import serialize from "./serializer";

type SerializedOrNull = null | ReturnType<typeof serialize>;
export interface DocManifest {
  "head-prepend": SerializedOrNull;
  head: SerializedOrNull;
  "body-prepend": SerializedOrNull;
  body: SerializedOrNull;
}

const MARKER_COMMENT = "MARKO_VITE";

export function generateDocManifest(rawHtml: string): Promise<DocManifest> {
  return new Promise((resolve, reject) => {
    const parser = new Parser(
      new DomHandler(function (err, dom) {
        if (err) {
          return reject(err);
        }

        const htmlChildren = dom.find(isElement)!.childNodes;
        const headPrepend: Node[] = [];
        const head: Node[] = [];
        const bodyPrepend: Node[] = [];
        const body: Node[] = [];
        splitNodesByMarker(
          (
            htmlChildren.find(
              (node) => isElement(node) && node.tagName === "head"
            ) as Element
          ).childNodes,
          headPrepend,
          head
        );
        splitNodesByMarker(
          (
            htmlChildren.find(
              (node) => isElement(node) && node.tagName === "body"
            ) as Element
          ).childNodes,
          bodyPrepend,
          body
        );

        resolve({
          "head-prepend": serializeOrNull(headPrepend),
          head: serializeOrNull(head),
          "body-prepend": serializeOrNull(bodyPrepend),
          body: serializeOrNull(body),
        });
      })
    );
    parser.write(rawHtml);
    parser.end();
  });
}

export function generateInputDoc(entry: string) {
  return `<!DOCTYPE html><html><head><!--${MARKER_COMMENT}--></head><body><!--${MARKER_COMMENT}--><script async type="module" src=${JSON.stringify(
    entry
  )}></script></body></html>`;
}

function serializeOrNull(nodes: Node[]) {
  const result = serialize(nodes);
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
