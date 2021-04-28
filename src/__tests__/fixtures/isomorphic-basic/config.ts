import type { UserConfig } from "vite";
import marko from "../../..";

export const config = {
  plugins: [marko()],
} as UserConfig;

export const targets = ["server", "browser"];
export const serverEntry = "src/index.js";
