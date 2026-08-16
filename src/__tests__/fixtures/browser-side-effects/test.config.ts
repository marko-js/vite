// Unlinked fixture: the render lists which side-effect modules ran. Unlinked
// builds (Storybook, vitest) keep Vite's default side effect policy, so nothing
// is shaken out and the build matches dev. The `isomorphic-side-effects`
// fixture is the linked counterpart, where the server-only imports do drop.
export {};
