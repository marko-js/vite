/**
 * Plan-only dual-entry helpers for production client builds.
 * Pure functions so fail-closed miss paths can be unit-tested without
 * standing up a full Marko compile + Vite transform.
 */

const PERSISTED_IMPORT = /(["'`])([^"'`]*?)\?persisted\1/g;

/** Rewrite every ?persisted import to the merge artifact virtual id. */
export function rewriteLoadEntryPersistedImports(
  code: string,
  fileName: string,
  mergeVirtual: string | undefined,
): string {
  if (!code.includes("?persisted")) return code;
  if (!mergeVirtual) {
    throw new Error(
      `@marko/vite: persisted load-entry for ${fileName} still references ?persisted but no merge artifact was published`,
    );
  }
  let rewritten = 0;
  const next = code.replace(PERSISTED_IMPORT, () => {
    rewritten++;
    return JSON.stringify(mergeVirtual);
  });
  if (rewritten === 0 || next.includes("?persisted")) {
    throw new Error(
      `@marko/vite: persisted load-entry for ${fileName} still has unresolved ?persisted imports after rewrite (rewrote ${rewritten})`,
    );
  }
  return next;
}

/** Side-effect import of the merge artifact when plan-only emission is empty. */
export function planOnlyMergeSideEffect(
  fileName: string,
  mergeVirtual: string | undefined,
): string {
  if (!mergeVirtual) {
    throw new Error(
      `@marko/vite: plan-only module ${fileName} has no published merge artifact (refusing empty module)`,
    );
  }
  return `import ${JSON.stringify(mergeVirtual)};\n`;
}
