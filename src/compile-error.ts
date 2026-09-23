import { normalizePath } from "./normalize-path";

interface CompileError extends Error {
  filename?: string;
  label?: string;
  frame?: string;
  loc?: { start: { line: number; column: number } };
}

/**
 * Rebuilds a `@marko/compiler` error in the shape Rollup, Rolldown and Vite
 * print: they add `id:line:column` and `frame` around a plain `message`, and
 * Vite's SSR module runner keeps only enumerable fields.
 */
export function toBundlerError(err: unknown, id: string): unknown {
  const { name, message, filename, label, frame, loc } = err as CompileError;
  // Aggregates, compilers before 5.42.6 (no `filename`) and non-compile errors.
  if (filename === undefined || !label || !frame || !loc) return err;

  // The compiler resolves `filename` with the platform separator; ids use `/`.
  if (normalizePath(filename) !== normalizePath(id)) {
    // Rolldown reports every transform error against `id`, so an error in a
    // template this one analyzed keeps only its message, which names the file.
    return rebuild(name, message);
  }

  const error = rebuild(name, label);
  error.loc = { file: id, line: loc.start.line, column: loc.start.column };
  error.frame = frame;
  return error;
}

function rebuild(name: string, message: string) {
  const error = new Error(message) as Error & {
    loc?: { file: string; line: number; column: number };
    frame?: string;
  };
  error.name = name;
  // Bundlers print `stack` after the message and frame; this compile-time
  // error has no useful trace, and Rolldown strips exactly this prefix.
  error.stack = `${name}: ${message}`;
  return error;
}
