import type { types } from "@marko/compiler";
export default (tag: types.NodePath<types.MarkoTag>, t: typeof types) => {
  const body = tag.get("body");
  const tagName = (tag.get("name").node as types.StringLiteral).value;
  body.unshiftContainer("body", buildViteTag(t, `${tagName}-prepend`));
  body.pushContainer("body", buildViteTag(t, tagName));
};

function buildViteTag(t: typeof types, slot: string) {
  return t.markoTag(
    t.stringLiteral("vite"),
    [
      t.markoAttribute("slot", t.stringLiteral(slot)),
      t.markoAttribute("_p", t.numericLiteral(1)),
    ],
    t.markoTagBody([])
  );
}
