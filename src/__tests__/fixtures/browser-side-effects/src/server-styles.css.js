import { loaded } from "./tracker.js";

// A zero-runtime stylesheet module. Compiling it is what emits the stylesheet,
// so it must reach the client build even though its export is server-only.
loaded.push("css-js-stylesheet");

export function serverOnlyStyle() {
  return "server-only-style";
}
