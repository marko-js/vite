import type { types } from "@marko/compiler";
export default (tag: types.NodePath<types.MarkoTag>, t: typeof types) => {
  const body = tag.get("body");
  const tagName = (tag.get("name").node as types.StringLiteral).value;
  body.unshiftContainer("body", renderAssetsCall(t, `${tagName}-prepend`));
  body.pushContainer("body", renderAssetsCall(t, tagName));
};

function renderAssetsCall(t: typeof types, slot: string) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.memberExpression(t.identifier("out"), t.identifier("global")),
        t.identifier("___viteRenderAssets")
      ),
      [t.identifier("out"), t.stringLiteral(slot)]
    )
  );
}
