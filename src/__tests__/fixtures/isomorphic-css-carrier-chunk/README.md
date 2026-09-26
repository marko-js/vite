Three pages share a client entry (`layout.marko`'s `client import`) and a
layout stylesheet. `tag-a` (pages `/` and `/two`) renders `tag-b` (all three
pages), each with its own css module. `tag-b`'s css rides the shared chunk with
the layout's, but `tag-a`'s page set differs, so its stylesheet gets a chunk of
its own; once the css is extracted that chunk is only an `import` of the shared
chunk. The snapshot for `/` asserts no such script is preloaded. `/three` is
never visited: it exists only to split the page sets.
