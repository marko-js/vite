import type { Options } from "../../..";

export const ssr = true;
export const options: Options = {
  isEntry(importee) {
    return importee.endsWith("src/template.marko");
  },
};
