import type { types } from "@marko/compiler";
export default (tag: types.NodePath<types.MarkoTag>, t: typeof types) => {
  if ((tag.hub.file.markoOpts as any).markoViteLinked) {
    const body = tag.get("body");
    const tagName = (tag.get("name").node as types.StringLiteral).value;
    body.unshiftContainer("body", renderAssetsCall(t, `${tagName}-prepend`));
    body.pushContainer("body", renderAssetsCall(t, tagName));
  }
};

function renderAssetsCall(t: typeof types, slot: string) {
  return t.markoPlaceholder(
    t.callExpression(
      t.memberExpression(
        t.identifier("$global"),
        t.identifier("___viteRenderAssets"),
      ),
      [t.stringLiteral(slot)],
    ),
    false,
  );
}
