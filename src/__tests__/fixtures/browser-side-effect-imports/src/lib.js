// A "library" module with no sideEffects declaration anywhere: its used
// export must survive while its module-init side effect tree-shakes away.
export const used = 1;
globalThis.__libInitRan = true;
