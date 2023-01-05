import path from "path";
import fs from "fs";
import os from "os";
import type { BuildStore } from "./types";

export default class FileStore implements BuildStore {
  _id: string;
  _temp: Promise<string> | undefined;
  _cache: Map<string, string>;
  constructor(id: string) {
    this._id = id;
    this._cache = new Map();
  }
  async _getKeyPath(key: string) {
    this._temp ??= getTempDir(this._id);
    return path.join(await this._temp, key);
  }
  async has(key: string) {
    if (!this._cache.has(key)) {
      const path = await this._getKeyPath(key);
      try {
        await fs.promises.access(path);
      } catch (e) {
        return false;
      }
    }
    return true;
  }
  async get(key: string) {
    let value = this._cache.get(key);
    if (value === undefined) {
      const path = await this._getKeyPath(key);
      try {
        value = await fs.promises.readFile(path, "utf-8");
      } catch (e) {
        return undefined;
      }
      this._cache.set(key, value);
    }
    return value;
  }
  async set(key: string, value: string) {
    this._cache.set(key, value);
    const path = await this._getKeyPath(key);
    await fs.promises.writeFile(path, value, "utf-8");
  }
}

async function getTempDir(id: string) {
  const dir = path.join(os.tmpdir(), id);

  try {
    const stat = await fs.promises.stat(dir);
    if (stat.isDirectory()) {
      return dir;
    }
  } catch {
    await fs.promises.mkdir(dir);
    return dir;
  }

  throw new Error("Unable to create temp directory");
}
