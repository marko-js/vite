import type { UserConfig } from "vite";
import marko from "../../..";

export const config = {
  plugins: [
    marko({
      linked: false,
      runtimeId: "SOME_COMPONENTS",
    }),
  ],
} as UserConfig;

export const targets = ["browser"];
