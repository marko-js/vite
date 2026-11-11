export const ssr = true;
export const hmr = [
  {
    // A tag file added beside the template takes over the native element.
    changes: [["src/tags/aside.marko", null, "<span>Custom tag</span>\n"]],
  },
];
