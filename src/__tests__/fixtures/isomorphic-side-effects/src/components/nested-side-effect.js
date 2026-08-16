import { loaded } from "./tracker.js";

// Reached only through the bare `import "./nested-side-effect.js"` in
// `explicit-side-effect.js`. Exports nothing, so it survives only if the
// explicit side effect marking carries downstream.
loaded.push("nested-side-effect");
