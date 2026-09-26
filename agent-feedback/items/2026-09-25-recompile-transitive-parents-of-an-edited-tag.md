---
type: bug
impact: med
effort: low
site: src/index.ts › hotUpdate
---

# Recompile every template that transitively analyzed an edited tag, not only its direct parents

`hotUpdate` adds a template to the update only when its own `transformAnalyzedTags` entry contains the edited file. `meta.analyzedTags` lists direct children only, but a parent's DOM output also depends on facts that come from its grandchildren, such as whether a child's setup is empty. So when a static leaf tag becomes interactive, its direct parent is recompiled and the grandparent keeps its old output, which never imports or calls the middle tag's `$setup`. Client-rendered instances of the leaf then never initialize their state or attach their handlers, and this lasts until the dev server restarts. Direction: walk `transformAnalyzedTags` to a fixed point, adding the parents of every template already added, before collecting modules, and add an HMR fixture that edits a grandchild.

Check: copy `src/__tests__/fixtures/isomorphic-tags-api-hmr` to a new fixture. Inside its `<div#app>`, `template.marko` renders `<let/show=false/>`, `<button#show onClick() { show = true }>show</button>` and `<if=show><mid/></if>`. `tags/mid.marko` is `<div class="mid"><leaf/></div>` and `tags/leaf.marko` is `<button#leaf>static leaf</button>`. Give `test.config.ts` one `hmr` step that replaces the leaf with `<let/count=0/><button#leaf onClick() { count++ }>clicks ${count}</button>`, then clicks `#show` once and `#leaf` twice. The `dev-hmr` snapshot shows `clicks ` with no count, and the two leaf clicks change nothing. Starting the fixture with the edited leaf already in place (plain `steps`, no `hmr`) renders `clicks 0`, then `clicks 1`, then `clicks 2`.
