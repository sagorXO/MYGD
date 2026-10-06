import test from "node:test";
import assert from "node:assert/strict";

const { loadMygodCatalogConfig, describeMygodConfig, MygodConfigError } = await import("../src/modules/mygod/config.ts");

const TOKEN = "tok_SYNTHETIC_0123456789abcdefghijklmnop";
const goodEnv = () => ({
  MYGOD_CATALOG_API_BASE_URL: "https://catalog.example.test",
  MYGOD_CATALOG_API_TOKEN: TOKEN,
  MYGOD_STORE_GROUP: "mygermandoener",
  MYGOD_STORE_ID: "576712",
  MYGOD_ENVIRONMENT: "test",
});

test("loads a valid environment and applies defaults", () => {
  const config = loadMygodCatalogConfig(goodEnv());
  assert.equal(config.catalogBaseUrl, "https://catalog.example.test");
  assert.equal(config.catalogToken, TOKEN);
  assert.equal(config.group, "mygermandoener");
  assert.equal(config.storeId, "576712");
  assert.equal(config.environment, "test");
  assert.equal(config.catalogTimeoutMs, 10_000);
});

test("normalises a trailing slash on the base URL", () => {
  const config = loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_API_BASE_URL: "https://catalog.example.test/" });
  assert.equal(config.catalogBaseUrl, "https://catalog.example.test");
});

test("reports every missing variable by name, never by value", () => {
  const env = goodEnv();
  delete env.MYGOD_CATALOG_API_TOKEN;
  delete env.MYGOD_STORE_ID;
  assert.throws(
    () => loadMygodCatalogConfig(env),
    (error) => {
      assert.ok(error instanceof MygodConfigError);
      assert.deepEqual([...error.fields].sort(), ["MYGOD_CATALOG_API_TOKEN", "MYGOD_STORE_ID"]);
      assert.ok(!error.message.includes(TOKEN));
      return true;
    }
  );
});

test("rejects non-https, credentialed, query or fragment base URLs without echoing them", () => {
  for (const bad of [
    "http://catalog.example.test",
    "https://user:pass@catalog.example.test",
    "https://catalog.example.test/?token=abc",
    "https://catalog.example.test/#frag",
    "not a url",
  ]) {
    assert.throws(
      () => loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_API_BASE_URL: bad }),
      (error) => {
        assert.ok(error instanceof MygodConfigError, bad);
        assert.deepEqual(error.fields, ["MYGOD_CATALOG_API_BASE_URL"]);
        assert.ok(!error.message.includes(bad), `message must not echo ${bad}`);
        return true;
      }
    );
  }
});

test("rejects an unknown environment and a too-short token", () => {
  assert.throws(() => loadMygodCatalogConfig({ ...goodEnv(), MYGOD_ENVIRONMENT: "staging" }), MygodConfigError);
  assert.throws(() => loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_API_TOKEN: "short" }), MygodConfigError);
});

test("accepts a custom timeout and rejects a non-positive one", () => {
  assert.equal(loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_TIMEOUT_MS: "2500" }).catalogTimeoutMs, 2500);
  assert.throws(() => loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_TIMEOUT_MS: "0" }), MygodConfigError);
  assert.throws(() => loadMygodCatalogConfig({ ...goodEnv(), MYGOD_CATALOG_TIMEOUT_MS: "abc" }), MygodConfigError);
});

test("describeMygodConfig never contains the token", () => {
  const text = describeMygodConfig(loadMygodCatalogConfig(goodEnv()));
  assert.ok(!text.includes(TOKEN));
  assert.ok(text.includes("576712"));
  assert.ok(text.includes("mygermandoener"));
});
