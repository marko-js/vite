export default {
  css: {
    modules: {
      // The default scoped name hashes the file path, which differs across
      // platforms (windows path separators); pin it so snapshots are stable.
      generateScopedName: "_[local]_scoped",
    },
  },
};
