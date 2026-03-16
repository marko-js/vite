import path from "path";
export const POSIX_SEP = "/";
export const WINDOWS_SEP = "\\";
export const normalizePath =
  path.sep === WINDOWS_SEP
    ? (id: string) => id.replace(/\\/g, POSIX_SEP)
    : (id: string) => id;
