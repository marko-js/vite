export const ssr = true;
export const hmr = [
  {
    changes: [
      ["src/template.marko", "div { color: green }", "div { color: blue }"],
    ],
    async steps() {
      await page.click("#clickable");
    },
  },

  {
    changes: [
      ["src/template.marko", "div { color: blue }", "div { color: red }"],
    ],
    async steps() {
      await page.click("#clickable");
    },
  },
];
