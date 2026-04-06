export const ssr = true;
export async function steps() {
  await page.click("#clickable");
}
export const hmr = [
  {
    changes: [
      [
        "src/components/class-component.marko",
        "Clicks: ${state.clickCount}",
        "Click count: ${state.clickCount}",
      ],
    ],
  },
];
