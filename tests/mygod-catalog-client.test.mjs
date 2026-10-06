import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { fetchCatalog, fetchCatalogWithRetry, CatalogError } = await import("../src/modules/mygod/catalog.client.ts");

const TOKEN = "tok_SYNTHETIC_0123456789abcdefghijklmnop";
const config = {
  catalogBaseUrl: "https://catalog.example.test",
  catalogToken: TOKEN,
  group: "mygermandoener",
  storeId: "576712",
  environment: "test",
  catalogTimeoutMs: 1000,
};
const fixtureText = readFileSync(new URL("./fixtures/mygod/catalog.json", import.meta.url), "utf8");

const jsonResponse = (body, init = {}) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
const envelope = (comment_id, extra = {}) => ({
  success: false, comment_id, message: "synthetic", next_steps: ["retry"], request_id: "req-123", retriable: true, ...extra,
});

async function failureOf(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail("expected the call to fail");
}

test("C1: sends an authenticated GET with g, s, accept header and a timeout signal", async () => {
  let seen;
  const fetchFn = async (url, init) => {
    seen = { url: String(url), init };
    return jsonResponse(fixtureText);
  };
  const catalog = await fetchCatalog(config, { fetchFn });
  assert.equal(seen.url, "https://catalog.example.test/v1/catalog?g=mygermandoener&s=576712");
  assert.equal(seen.init.method, "GET");
  assert.equal(seen.init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(seen.init.headers.Accept, "application/json");
  assert.ok(seen.init.signal instanceof AbortSignal);
  assert.equal(catalog.catalog_revision, "synthetic-catalog-1");
  assert.equal(catalog.catalog.products.length, 3);
});

test("C1: the token never appears in the URL", async () => {
  let url = "";
  await fetchCatalog(config, { fetchFn: async (u) => ((url = String(u)), jsonResponse(fixtureText)) });
  assert.ok(!url.includes(TOKEN));
});

test("C3: 401, 403, 400 map to distinct non-retriable errors", async () => {
  const cases = [
    [401, "invalid_auth", "auth"],
    [403, "scope_not_allowed", "forbidden"],
    [400, "invalid_params", "invalid_params"],
  ];
  for (const [status, commentId, kind] of cases) {
    const error = await failureOf(fetchCatalog(config, { fetchFn: async () => jsonResponse(envelope(commentId, { retriable: false }), { status }) }));
    assert.ok(error instanceof CatalogError);
    assert.equal(error.kind, kind);
    assert.equal(error.status, status);
    assert.equal(error.retriable, false);
    assert.equal(error.requestId, "req-123");
  }
});

test("C3: 429 carries Retry-After seconds and is retriable", async () => {
  const error = await failureOf(
    fetchCatalog(config, { fetchFn: async () => jsonResponse(envelope("rate_limit_exceeded"), { status: 429, headers: { "retry-after": "7" } }) })
  );
  assert.equal(error.kind, "rate_limited");
  assert.equal(error.retryAfterSeconds, 7);
  assert.equal(error.retriable, true);
});

test("C3: 503 and 500 are unavailable and retriable, request id taken from the body", async () => {
  for (const status of [503, 500]) {
    const error = await failureOf(fetchCatalog(config, { fetchFn: async () => jsonResponse(envelope("catalog_unavailable"), { status }) }));
    assert.equal(error.kind, "unavailable");
    assert.equal(error.retriable, true);
    assert.equal(error.requestId, "req-123");
  }
});

test("C3: an error status with a non-JSON body still fails cleanly", async () => {
  const error = await failureOf(fetchCatalog(config, { fetchFn: async () => new Response("<html>bad gateway</html>", { status: 502 }) }));
  assert.equal(error.kind, "unavailable");
  assert.equal(error.requestId, undefined);
});

test("C3: an unexpected status is reported as such", async () => {
  const error = await failureOf(fetchCatalog(config, { fetchFn: async () => new Response("", { status: 418 }) }));
  assert.equal(error.kind, "unexpected_status");
  assert.equal(error.status, 418);
});

test("C3: a timeout is its own error", async () => {
  const fetchFn = (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
  const error = await failureOf(fetchCatalog({ ...config, catalogTimeoutMs: 20 }, { fetchFn }));
  assert.equal(error.kind, "timeout");
  assert.equal(error.retriable, true);
});

test("C2: an invalid shape is a typed error, never an empty catalog", async () => {
  const bad = JSON.parse(fixtureText);
  bad.catalog.products[0].price = "free";
  const error = await failureOf(fetchCatalog(config, { fetchFn: async () => jsonResponse(bad) }));
  assert.equal(error.kind, "schema_mismatch");
  assert.equal(error.retriable, false);
  assert.ok(Array.isArray(error.issuePaths) && error.issuePaths.length > 0);
});

test("C2: a 200 with a non-JSON body is a schema mismatch", async () => {
  const error = await failureOf(fetchCatalog(config, { fetchFn: async () => new Response("not json", { status: 200 }) }));
  assert.equal(error.kind, "schema_mismatch");
});

test("a response larger than the 2 MiB contract limit is refused", async () => {
  const error = await failureOf(fetchCatalog(config, { fetchFn: async () => jsonResponse(fixtureText), maxBytes: 100 }));
  assert.equal(error.kind, "too_large");
});

test("a response for another store or environment is refused", async () => {
  for (const patch of [{ group: "someone-else" }, { store_id: "000001" }, { environment: "production" }]) {
    const error = await failureOf(fetchCatalog(config, { fetchFn: async () => jsonResponse({ ...JSON.parse(fixtureText), ...patch }) }));
    assert.equal(error.kind, "scope_mismatch", JSON.stringify(patch));
  }
});

test("C1: the token never appears in a network error, its message, or its JSON form", async () => {
  const fetchFn = async () => {
    throw new Error(`connect failed using Bearer ${TOKEN}`);
  };
  const error = await failureOf(fetchCatalog(config, { fetchFn }));
  assert.equal(error.kind, "network");
  assert.ok(!error.message.includes(TOKEN));
  assert.ok(!JSON.stringify(error).includes(TOKEN));
  assert.ok(!String(error.stack).includes(TOKEN));
});

test("C1: a server message that echoes the token is redacted", async () => {
  const error = await failureOf(
    fetchCatalog(config, { fetchFn: async () => jsonResponse(envelope("invalid_auth", { message: `bad token ${TOKEN}`, retriable: false }), { status: 401 }) })
  );
  assert.ok(!error.message.includes(TOKEN));
  assert.ok(!JSON.stringify(error).includes(TOKEN));
});

test("retry: 503 then 200 succeeds after one backoff sleep", async () => {
  const calls = [];
  const sleeps = [];
  const fetchFn = async () => {
    calls.push(1);
    return calls.length === 1 ? jsonResponse(envelope("catalog_unavailable"), { status: 503 }) : jsonResponse(fixtureText);
  };
  const catalog = await fetchCatalogWithRetry(config, { fetchFn, sleep: async (ms) => sleeps.push(ms), jitter: () => 0 });
  assert.equal(catalog.catalog_revision, "synthetic-catalog-1");
  assert.equal(calls.length, 2);
  assert.equal(sleeps.length, 1);
  assert.ok(sleeps[0] > 0);
});

test("retry: honours Retry-After on 429 (capped at 60 s)", async () => {
  const sleeps = [];
  let n = 0;
  const fetchFn = async () => {
    n += 1;
    if (n === 1) return jsonResponse(envelope("rate_limit_exceeded"), { status: 429, headers: { "retry-after": "3" } });
    if (n === 2) return jsonResponse(envelope("rate_limit_exceeded"), { status: 429, headers: { "retry-after": "9999" } });
    return jsonResponse(fixtureText);
  };
  await fetchCatalogWithRetry(config, { fetchFn, sleep: async (ms) => sleeps.push(ms), jitter: () => 0, maxAttempts: 3 });
  assert.deepEqual(sleeps, [3000, 60_000]);
});

test("retry: auth and schema failures are never retried", async () => {
  for (const respond of [
    () => jsonResponse(envelope("invalid_auth", { retriable: false }), { status: 401 }),
    () => jsonResponse({ nope: true }),
  ]) {
    let calls = 0;
    const error = await failureOf(fetchCatalogWithRetry(config, { fetchFn: async () => (calls++, respond()), sleep: async () => {}, jitter: () => 0 }));
    assert.equal(calls, 1);
    assert.ok(error instanceof CatalogError);
  }
});

test("retry: gives up after maxAttempts and throws the last error", async () => {
  let calls = 0;
  const error = await failureOf(
    fetchCatalogWithRetry(config, {
      fetchFn: async () => (calls++, jsonResponse(envelope("catalog_unavailable"), { status: 503 })),
      sleep: async () => {},
      jitter: () => 0,
      maxAttempts: 3,
    })
  );
  assert.equal(calls, 3);
  assert.equal(error.kind, "unavailable");
});
