export const ssr = true;
export const hmr = [
  {
    // The grandchild's `<return>` becomes state, so the page, which reads it
    // through its child's tag variable, compiles again though it lists only
    // the child.
    changes: [
      [
        "src/tags/grandchild-tag.marko",
        "<return=1/>",
        "<let/count=1/>\n<button#bump onClick() { count++ }>bump</button>\n<return=count/>",
      ],
    ],
    steps: [
      () => {
        browser.window.document.querySelector<HTMLElement>("#bump")!.click();
      },
    ],
  },
];
