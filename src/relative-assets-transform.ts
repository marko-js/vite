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
]);

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
      if (
        !(
          (
            value[0] === "/" || // Ignore absolute paths.
            !/\.[^.]+$/.test(value) || // Ignore paths without a file extension.
            /^[a-z]{2,}:/i.test(value)
          ) // Ignore paths with a protocol.
        )
      ) {
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
