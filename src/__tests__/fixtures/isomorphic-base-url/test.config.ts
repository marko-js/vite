export const ssr = true;
export async function steps() {
  await page.click("#clickable");
}

export const env = {
  BASE_URL: "some/base/path/",
};
