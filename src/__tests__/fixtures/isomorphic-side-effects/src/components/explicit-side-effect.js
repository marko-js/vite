// A bare import of its own: the marking has to reach it too.
import "./nested-side-effect.js";

import { loaded } from "./tracker.js";

// An explicit bare `import "x"` side effect — must always run on the client.
loaded.push("explicit-side-effect");
