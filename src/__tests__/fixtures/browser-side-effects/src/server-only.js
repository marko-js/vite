import { loaded } from "./tracker.js";

// Runs only if this module ends up in the client bundle.
loaded.push("server-only");

export function onlyServer() {
  return "server-only-result";
}
