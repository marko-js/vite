export const ssr = true;
export const error = true;
// The Marko this repo installs predates patches; unlinked, as a write-less
// build must be.
export const options = { linked: false, patches: true };
