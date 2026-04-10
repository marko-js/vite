export const ssr = true;
export const hmr = [
  {
    changes: [
      ["src/template.marko", "div { color: green }", "div { color: blue }"],
    ],
  },
];
