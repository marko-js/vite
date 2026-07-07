import { loaded } from "./tracker.js";

// An explicit bare `import "x"` side effect — must always run on the client.
loaded.push("explicit-side-effect");
