export const ssr = true;
export const hmr = [
  {
    changes: [
      ["src/template.marko", "div { color: green }", "div { color: blue }"],
    ],
    steps() {
      browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
    },
  },

  {
    changes: [
      ["src/template.marko", "div { color: blue }", "div { color: red }"],
    ],
    steps() {
      browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
    },
  },
];
