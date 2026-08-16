// Linked fixture: the render lists which side-effect modules ran on the client.
// The build tree-shakes the server-only ones out; the bare and used imports
// remain. The `browser-side-effects` fixture is the unlinked counterpart, where
// none of this shaking applies.
export const ssr = true;
