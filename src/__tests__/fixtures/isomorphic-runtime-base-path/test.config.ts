import type { Options } from "../../..";
import assert from "assert";

async function hasScript(pattern: RegExp) {
  const headScripts = await page.locator("head > script");
  const len = await headScripts.count();
  for (let i = 0; i < len; i++) {
    const script = await headScripts.nth(i).innerHTML();
    if (pattern.test(script)) {
      return true;
    }
  }
  return false;
}

export const ssr = true;
export async function steps() {
  assert(
    await hasScript(/\$mbp[a-z0-1-_\s]*=/i),
    "Base path script not found in head",
  );
  await page.click("#clickable");
}
export const options: Options = {
  basePathVar: "assetsPath",
};
