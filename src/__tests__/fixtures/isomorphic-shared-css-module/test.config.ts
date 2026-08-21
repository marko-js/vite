export const ssr = true;
export function steps() {
  // Reflect the injected assets into #app so the snapshot records whether a
  // script was emitted for a page whose only shared module is a stylesheet.
  const app = browser.window.document.getElementById("app")!;
  for (const el of browser.window.document.querySelectorAll(
    "link[rel=stylesheet], script[src]",
  )) {
    app.append(
      `[${el.tagName.toLowerCase()}: ${el.getAttribute("href") || el.getAttribute("src")}]`,
    );
  }
}
