import fs from "fs";
import assert from "assert";
import FileStore from "../file-store";

let store: FileStore;
beforeEach(() => {
  store = new FileStore("test");
});

afterEach(async () => {
  try {
    const dir = await store._temp;
    if (dir) {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  } catch (err) {
    // do nothing
  }
});

describe("file store should", () => {
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

  it("throw when unable to create a temp directory", async () => {
    const mkdir = fs.promises.mkdir;
    fs.promises.mkdir = () => {
      throw new Error("Fake `fs.promises.mkdir` always throws");
    };

    try {
      await store.set("hello", "world");
      assert.fail();
    } catch (err) {
      fs.promises.mkdir = mkdir;
    } finally {
      fs.promises.mkdir = mkdir;
    }
  });
});
