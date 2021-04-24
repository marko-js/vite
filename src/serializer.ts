import { ElementType } from "domelementtype";
import type { Node, Element, Comment, Text } from "domhandler";

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

export default function serialize(nodes: Node[], parts?: string[]) {
  let curString = parts ? (parts.pop() as string) : "";
  parts ??= [];

  for (const node of nodes) {
    switch (node.type) {
      case ElementType.Tag:
      case ElementType.Style:
      case ElementType.Script: {
        const tag = node as Element;
        const { name } = tag;
        curString += `<${name}`;

        switch (tag.tagName) {
          case "script":
            parts.push(curString);
            curString = "";
            break;
          case "style":
            parts.push(curString);
            curString = "";
            break;
          case "link":
            if (tag.attribs.rel === "stylesheet") {
              parts.push(curString);
              curString = "";
            }
            break;
        }

        for (const attr of tag.attributes) {
          curString += ` ${
            attr.value === ""
              ? attr.name
              : `${attr.name}="${attr.value.replace(/"/g, "&#39;")}"`
          }`;
        }

        curString += ">";

        if (tag.children.length) {
          parts.push(curString);
          serialize(tag.children, parts);
          curString = parts.pop() as string;
        }

        if (!voidElements.has(name)) {
          curString += `</${name}>`;
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
