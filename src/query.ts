// Vite (and anything built on it) tags module ids with queries: cache busters
// (`?v=`, `?t=`), and one-off markers other tools bolt on. The file being
// requested is always the path before the `?`.
export function cleanUrl(id: string) {
  const queryStart = id.indexOf("?");
  return queryStart === -1 ? id : id.slice(0, queryStart);
}

// The queries below change what the module *is* instead of just tagging the
// id, and vite serves them itself, so a `.marko` file carrying one must be left
// uncompiled. Every other query is transparent.
const opaqueQueryReg =
  /(?:^|&)(?:raw|url|inline|no-inline|worker|sharedworker|worklet|html-proxy|direct)(?:[&=]|$)/;

export function hasOpaqueQuery(id: string) {
  const queryStart = id.indexOf("?");
  return queryStart !== -1 && opaqueQueryReg.test(id.slice(queryStart + 1));
}
