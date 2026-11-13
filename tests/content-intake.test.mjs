import test from "node:test";
import assert from "node:assert/strict";
import { uploadContentSources } from "../lib/content-intake-upload.mjs";
import { intakeContent } from "../lib/content-intake.mjs";
import { portalReturn } from "../lib/portal-return.mjs";
const fixture = {
  title: "Documented hotel",
  summary: "Approved overview",
  body: "Source-based description",
  seo_title: "Hotel opportunity",
  seo_description: "Documented property",
  keywords: ["hotel investment"],
  fields: {
    keys: "110 rooms",
    latitude: "28.5",
    longitude: "77.2",
    location_source: "Supplied map link",
    sku: "bad source SKU",
    city: "Noida",
  },
  evidence: [],
  review_questions: [],
};
test("fills editorial and SEO fields while withholding unverified coordinates and invalid SKU", () => {
  const result = intakeContent(
    { draft: fixture },
    { kind: "opportunity", id: "abcdef12", slug: "ig-opp-123" },
  );
  assert.equal(result.public_data.keys, "110");
  assert.equal(result.public_data.latitude, undefined);
  assert.equal(result.public_data.sku, undefined);
  assert.equal(result.public_data.city, "Noida");
  assert.equal(result.public_data.seo_keywords, "hotel investment");
  assert.equal(result.body, fixture.body);
  assert.equal(result.slug, "ig-opp-123");
  assert.equal(fixture.fields.keys, "110 rooms");
});
test("uploads once to the linked private room, retries completion, then registers source", async () => {
  const calls = [],
    prepared = new Map();
  let attempts = 0,
    transfers = 0;
  const fetcher = async (url, request) => {
    const p = JSON.parse(request.body);
    calls.push([url, p]);
    if (p.action === "prepare")
      return Response.json({
        id: "file1",
        path: "room/file1",
        token: "signed",
        version: 1,
      });
    if (p.action === "complete" && attempts++ === 0)
      return Response.json(
        { error: "Temporary validation failure" },
        { status: 503 },
      );
    return Response.json(p.action === "source" ? { id: "source1" } : {});
  };
  const args = {
    files: [{ name: "Property.pdf", size: 9 }],
    workspace: { id: "w1", room_id: "room" },
    projectUrl: "https://example.supabase.co",
    prepared,
    fetcher,
    hashFile: async () => "a".repeat(64),
    uploadFile: async (p) => {
      assert.equal(p.bucket, "ig-data-rooms");
      assert.equal(p.upload.path, "room/file1");
      transfers++;
    },
  };
  await assert.rejects(uploadContentSources(args), /Temporary validation/);
  assert.deepEqual(await uploadContentSources(args), ["source1"]);
  assert.equal(transfers, 1);
  assert.equal(calls.filter(([, p]) => p.action === "prepare").length, 1);
  assert.equal(calls[0][1].download_enabled, false);
  assert.equal(calls.at(-1)[1].approved, true);
});
test("registration failure preserves the completed original for retry", async () => {
  let preparedCount = 0,
    completeCount = 0,
    registered = 0;
  const fetcher = async (url, r) => {
    const p = JSON.parse(r.body);
    if (p.action === "prepare") {
      preparedCount++;
      return Response.json({ id: "f", path: "r/f", version: 1, token: "t" });
    }
    if (p.action === "complete") {
      completeCount++;
      return Response.json({});
    }
    if (!registered++)
      return Response.json({ error: "Retry registration" }, { status: 503 });
    return Response.json({ id: "s" });
  };
  const args = {
    files: [{ name: "p.pdf", size: 1 }],
    workspace: { id: "w", room_id: "r" },
    prepared: new Map(),
    fetcher,
    hashFile: async () => "b".repeat(64),
    uploadFile: async () => {},
  };
  await assert.rejects(uploadContentSources(args));
  await uploadContentSources(args);
  assert.equal(preparedCount, 1);
  assert.equal(completeCount, 1);
});
test("portal return accepts only shared room or project NDA destinations", () => {
  assert.equal(
    portalReturn("/account/nda?opportunity=ig-opp-123"),
    "/account/nda?opportunity=ig-opp-123",
  );
  assert.equal(
    portalReturn("/account/data-rooms/12345678-1234-1234-1234-123456789012"),
    "/account/data-rooms/12345678-1234-1234-1234-123456789012",
  );
  for (const url of [
    "//evil.example",
    "https://evil.example",
    "/admin",
    "/account/nda?opportunity=x&next=evil",
    "/account/data-rooms/../settings",
  ])
    assert.equal(portalReturn(url), null);
});

test("all signed uploads use the signed TUS endpoint and never overwrite originals", async () => {
  const { resumableSourceUpload } = await import("../lib/intake-upload.mjs");
  let settings;
  class MockUpload {
    constructor(file, options) {
      settings = options;
    }
    async findPreviousUploads() {
      return [];
    }
    start() {
      settings.onSuccess();
    }
  }
  await resumableSourceUpload({
    file: { name: "large.pptx" },
    upload: { token: "private-token", path: "r/f" },
    source: { id: "f", sha256: "hash" },
    projectUrl: "https://project.supabase.co",
    UploadClass: MockUpload,
  });
  assert.equal(
    settings.endpoint,
    "https://project.storage.supabase.co/storage/v1/upload/resumable/sign",
  );
  assert.equal(settings.headers["x-signature"], "private-token");
  assert.equal(settings.headers["x-upsert"], undefined);
  assert.equal(settings.chunkSize, 6 * 1024 * 1024);
  assert.match(await settings.fingerprint(), /signed-v2/);
});
test("upload errors explain authentication failure without leaking provider secrets", async () => {
  const { uploadFailure } = await import("../lib/intake-upload.mjs");
  const msg = uploadFailure("source.pdf", {
    originalResponse: {
      getStatus: () => 400,
      getBody: () =>
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid Compact JWS",
          secret: "must-not-leak",
        }),
    },
  });
  assert.match(msg, /authorisation was rejected/);
  assert.match(msg, /Storage 400/);
  assert.doesNotMatch(msg, /must-not-leak|capacity/);
});
