require("esbuild-register/dist/node").register({
  target: ["node14"],
  define: { "import.meta.url": "__filename" },
});
