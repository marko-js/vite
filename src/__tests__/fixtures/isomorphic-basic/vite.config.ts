import type { UserConfig } from "vite";
import marko from "../../..";

export default {
  plugins: [marko()],
  build: {
    emptyOutDir: false, // Avoid server / client deleting files from each other.
    rollupOptions: {
      output: {
        // Output ESM for the server build also.
        // Remove when https://github.com/vitejs/vite/issues/2152 is resolved.
        format: "es",
      },
    },
  },
} as UserConfig;
