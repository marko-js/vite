export const ssr = true;
export function steps() {
  browser.window.document.querySelector<HTMLElement>("#clickable")!.click();
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
