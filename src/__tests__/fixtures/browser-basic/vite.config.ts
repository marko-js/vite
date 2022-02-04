import type { UserConfig } from "vite";
import marko from "../../..";

export default {
  plugins: [marko({ linked: false })],
} as UserConfig;
