import { ElementType } from "domelementtype";
import type { Comment, Element, Node, Text } from "domhandler";

enum InjectType {
  AssetAttrs = 0,
  PublicPath = 1,
  Dedupe = 2,
}

const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export default function serialize(
  basePath: string,
  nodes: Node[],
  preload: string[],
  parts?: (string | InjectType)[],
) {
  let curString = parts ? (parts.pop() as string) : "";
  parts ??= [];

  for (const node of nodes) {
    switch (node.type) {
      case ElementType.Tag:
      case ElementType.Style:
      case ElementType.Script: {
        const tag = node as Element;
        const { name } = tag;
        let urlAttr: undefined | string;
        let isDedupe = 0;

        switch (tag.tagName) {
          case "script":
            if (tag.attribs.src) {
              if (curString) {
                parts.push(curString);
                curString = "";
              }
              isDedupe = parts.push(InjectType.Dedupe, tag.attribs.src, 0) - 1;
            }
            parts.push(`${curString}<${name}`, InjectType.AssetAttrs);
            curString = "";
            urlAttr = "src";
            break;
          case "style":
            parts.push(`${curString}<${name}`, InjectType.AssetAttrs);
            curString = "";
            break;
          case "link":
            if (tag.attribs.href) {
              if (curString) {
                parts.push(curString);
                curString = "";
              }
              isDedupe =
                parts.push(
                  InjectType.Dedupe,
                  [tag.attribs.rel || "", tag.attribs.href, tag.attribs.as]
                    .filter((it) => it != null)
                    .join("#"),
                  0,
                ) - 1;
            }
            urlAttr = "href";
            if (
              tag.attribs.rel === "stylesheet" ||
              tag.attribs.rel === "modulepreload" ||
              tag.attribs.as === "style" ||
              tag.attribs.as === "script"
            ) {
              parts.push(`${curString}<${name}`, InjectType.AssetAttrs);
              curString = "";
            } else {
              curString += `<${name}`;
            }
            break;
          default:
            curString += `<${name}`;
            break;
        }

        for (const attr of tag.attributes) {
          if (attr.value === "") {
            curString += ` ${attr.name}`;
          } else if (attr.name === urlAttr) {
            const id = stripBasePath(basePath, attr.value).replace(/^\.\//, "");

            if (tag.name === "script") {
              preload.push(id);
            }

            curString += ` ${attr.name}="`;
            parts.push(
              curString,
              InjectType.PublicPath,
              id.replace(/"/g, "&#39;") + '"',
            );
            curString = "";
          } else {
            curString += ` ${attr.name}="${attr.value.replace(/"/g, "&#39;")}"`;
          }
        }

        curString += ">";

        if (tag.children.length) {
          parts.push(curString);
          serialize(basePath, tag.children, preload, parts);
          curString = parts.pop() as string;
        }

        if (!voidElements.has(name)) {
          curString += `</${name}>`;
        }
        if (isDedupe) {
          if (curString) {
            parts.push(curString);
            curString = "";
          }
          parts[isDedupe] = parts.length - isDedupe - 1;
        }

        break;
      }
      case ElementType.Text: {
        const text = (node as Text).data;

        if (!/^\s*$/.test(text)) {
          curString += text;
        }

        break;
      }
      case ElementType.Comment:
        curString += `<!--${(node as Comment).data}-->`;
        break;
    }
  }

  if (curString) {
    parts.push(curString);
  }

  return parts;
}

function stripBasePath(basePath: string, path: string) {
  if (path.startsWith(basePath)) return path.slice(basePath.length);
  return path;
}
