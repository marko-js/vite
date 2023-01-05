import assert from "assert";
import MemoryStore from "../memory-store";

let store: MemoryStore;
beforeEach(() => {
  store = new MemoryStore();
});

describe("memory store should", () => {
  it("allow retrieving data", async () => {
    const expectedKey = "hello";
    const expectedData = "world";

    await store.set(expectedKey, expectedData);

    assert.equal(await store.get(expectedKey), expectedData);
    assert.equal(await store.get("non-existing key"), undefined);
  });

  it("allow checking for existence of data", async () => {
    const expectedKey = "hello";

    await store.set(expectedKey, "");

    assert.equal(await store.has(expectedKey), true);
    assert.equal(await store.has("non-existing key"), false);
  });
});
