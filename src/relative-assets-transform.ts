import type { types } from "@marko/compiler";
const attrSrc = new Set(["src"]);
const attrHref = new Set(["href"]);
const assetAttrsByTag = new Map([
  ["audio", attrSrc],
  ["embed", attrSrc],
  ["iframe", attrSrc],
  ["img", new Set(["src", "srcset"])],
  ["input", attrSrc],
  ["source", attrSrc],
  ["track", attrSrc],
  ["video", new Set(["src", "poster"])],
  ["a", attrHref],
  ["area", attrHref],
  ["link", attrHref],
  ["object", new Set(["data"])],
  ["body", new Set(["background"])],
  ["script", new Set(["src"])],
]);
const assetFileReg =
  /(?:^\..*\.(?:a?png|jpe?g|jfif|pipeg|pjp|gif|svg|ico|web[pm]|avif|mp4|ogg|mp3|wav|flac|aac|opus|woff2?|eot|[ot]tf|webmanifest|pdf|txt)(\?|$)|\?url\b)/;

export default function transform(
  tag: types.NodePath<types.MarkoTag>,
  t: typeof types,
) {
  const { name, attributes } = tag.node;
  if (name.type !== "StringLiteral") {
    return;
  }

  const assetAttrs = assetAttrsByTag.get(name.value);
  if (!assetAttrs) {
    return;
  }

  for (const attr of attributes) {
    if (
      attr.type === "MarkoAttribute" &&
      attr.value.type === "StringLiteral" &&
      assetAttrs.has(attr.name)
    ) {
      const { value } = attr.value;
      if (assetFileReg.test(value)) {
        const importedId = tag.scope.generateUid(value);
        attr.value = t.identifier(importedId);
        tag.hub.file.path.unshiftContainer(
          "body",
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier(importedId))],
            t.stringLiteral(value),
          ),
        );
      }
    }
  }
}
