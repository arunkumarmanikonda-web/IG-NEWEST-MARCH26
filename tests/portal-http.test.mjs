import test from "node:test";
import assert from "node:assert/strict";
import { readJson, privateJson, errorJson } from "../lib/http.mjs";
const request = (body, headers = {}) =>
  new Request("https://preview.example/api/portal/action", {
    method: "POST",
    headers: {
      origin: "https://preview.example",
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
test("portal rejects cross-origin and absent-origin mutations", async () => {
  await assert.rejects(
    () => readJson(request("{}", { origin: "https://other.example" })),
    (e) => e.status === 403,
  );
  await assert.rejects(
    () => readJson(request("{}", { origin: "" })),
    (e) => e.status === 403,
  );
});
test("portal accepts valid same-origin JSON objects", async () => {
  assert.deepEqual(await readJson(request('{"module":"account"}')), {
    module: "account",
  });
});
test("portal rejects wrong media types and non-object JSON", async () => {
  await assert.rejects(
    () => readJson(request("{}", { "content-type": "text/plain" })),
    (e) => e.status === 415,
  );
  for (const body of ["null", "[]", "false", "invalid"])
    await assert.rejects(
      () => readJson(request(body)),
      (e) => e.status === 400,
    );
});
test("portal bounds streamed body size", async () => {
  await assert.rejects(
    () => readJson(request(JSON.stringify({ value: "a".repeat(100) })), 30),
    (e) => e.status === 413,
  );
});
test("private replies prohibit caching and do not expose internal errors", async () => {
  assert.equal(
    privateJson({ ok: true }).headers.get("cache-control"),
    "private, no-store",
  );
  const result = errorJson(new Error("Database password or internal stack"));
  assert.equal(result.status, 500);
  assert.deepEqual(await result.json(), {
    error: "The request could not be completed.",
  });
});

test("proxy-normalised URL still verifies the actual destination host", async () => {
  const req = new Request("http://internal:3100/api", {
    method: "POST",
    headers: {
      Host: "preview.example",
      Origin: "http://preview.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.deepEqual(await readJson(req), {});
  const bad = new Request("http://internal:3100/api", {
    method: "POST",
    headers: {
      Host: "preview.example",
      Origin: "http://evil.example",
      "X-Forwarded-Host": "evil.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  await assert.rejects(
    () => readJson(bad),
    (e) => e.status === 403,
  );
});
