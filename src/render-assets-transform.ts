import type { types } from "@marko/compiler";
export default (tag: types.NodePath<types.MarkoTag>, t: typeof types) => {
  const body = tag.get("body");
  const tagName = (tag.get("name").node as types.StringLiteral).value;
  body.unshiftContainer("body", renderAssetsCall(t, `${tagName}-prepend`));
  body.pushContainer("body", renderAssetsCall(t, tagName));
};

function renderAssetsCall(t: typeof types, slot: string) {
  return t.markoTag(
    t.stringLiteral("_vite"),
    [t.markoAttribute("slot", t.stringLiteral(slot))],
    t.markoTagBody()
  );
}
