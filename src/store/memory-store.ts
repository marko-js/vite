import type { BuildStore } from "./types";

export default class MemoryStore implements BuildStore {
  _store: Map<string, string>;
  constructor() {
    this._store = new Map();
  }
  async has(key: string) {
    return Promise.resolve(this._store.has(key));
  }
  async get(key: string) {
    return Promise.resolve(this._store.get(key));
  }
  async set(key: string, value: string) {
    this._store.set(key, value);
  }
}
