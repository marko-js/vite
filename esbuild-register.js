require("esbuild-register/dist/node").register({
  target: ["node12"],
  define: { "import.meta.url": "__filename" },
});
