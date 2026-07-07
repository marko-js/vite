// Records which side-effect modules ran on the client. On a global so the
// `impure-lib` package shares it; the template renders the result.
export const loaded = (globalThis.__markoLoaded ??= []);
