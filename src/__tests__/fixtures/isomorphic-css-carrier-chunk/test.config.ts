export const ssr = true;
export function steps() {
  // Reflect the injected assets into #app so the snapshot records which
  // scripts a page loads: modulepreloads included, since a chunk that only
  // carries a stylesheet is never a <script>, only a preload the entry imports.
  const app = browser.window.document.getElementById("app")!;
  for (const el of browser.window.document.querySelectorAll(
    "link[rel=stylesheet], link[rel=modulepreload], script[src]",
  )) {
    app.append(
      `[${el.tagName.toLowerCase()}: ${el.getAttribute("href") || el.getAttribute("src")}]`,
    );
  }
}
