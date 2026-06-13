import type { types } from "@marko/compiler";
export default (tag: types.NodePath<types.MarkoTag>, t: typeof types) => {
  const markoOpts = tag.hub.file.markoOpts as any;
  // When the compiler's built-in asset orchestration (the `linkAssets`
  // compiler option) is used it takes care of flushing assets itself.
  if (markoOpts.markoViteLinked && !markoOpts.linkAssets) {
    const body = tag.get("body");
    const tagName = (tag.get("name").node as types.StringLiteral).value;
    body.unshiftContainer("body", renderAssetsCall(t, `${tagName}-prepend`));
    body.pushContainer("body", renderAssetsCall(t, tagName));
  }
};

function renderAssetsCall(t: typeof types, slot: string) {
  return t.markoPlaceholder(
    t.optionalCallExpression(
      t.memberExpression(
        t.identifier("$global"),
        t.identifier("___viteRenderAssets"),
      ),
      [t.stringLiteral(slot)],
      true,
    ),
    false,
  );
}
