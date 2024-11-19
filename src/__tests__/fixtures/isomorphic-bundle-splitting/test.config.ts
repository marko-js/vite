export const ssr = true;
export async function steps() {
  for (const el of await page.$$(".clickable")) {
    await el.click();
  }
}
