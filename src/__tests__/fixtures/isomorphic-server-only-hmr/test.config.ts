export const ssr = true;
export async function steps() {
  await page.click("#clickable");
}
export const hmr = [
  {
    changes: [["src/template.marko", "<h1>Hello</h1>", "<h1>Goodbye</h1>"]],
    steps,
  },
  {
    changes: [
      [
        "src/components/implicit-component.marko",
        "<h2>Server text</h2>",
        "<h2>Updated</h2>",
      ],
    ],
  },
];
