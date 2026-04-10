import type { Plugin } from "vite";

export default (): Plugin => {
  return {
    name: "inject-hmr-events",
    enforce: "pre",
    apply: "serve",
    transform(source, id) {
      if (id.endsWith("client-entry.marko")) {
        return (
          source +
          `
if (import.meta.hot) {
  import.meta.hot.on("vite:afterUpdate", () => {
    requestAnimationFrame(() => {
      window.__nextHmr.resolve();
      window.__nextHmr = createDeferred();
    });
  });
  import.meta.hot.on("vite:error", (err) => {
    window.__nextHmr.reject(err);
    window.__nextHmr = createDeferred();
  });

  window.__nextHmr ||= createDeferred();

  function createDeferred() {
    let resolve;
    let reject;
    const deferred = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    })
    deferred.resolve = resolve;
    deferred.reject = reject;
    return deferred;
  }
} else {
  window.__nextHmr ||= Promise.reject("import.meta.hot not defined");
}
`
        );
      }
    },
  };
};
