import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ),
  secret = process.env.ENQUIRY_INGEST_SECRET;
const p = {
  name: "Temporary integration test",
  email: "qa-enquiry@example.invalid",
  organisation: "Temporary test fixture",
  phone: "",
  practice: "QA verification",
  message: "This is a temporary integration test. Remove after verification.",
  request_id: crypto.randomUUID(),
  privacy: true,
  rate_key: crypto.randomBytes(32).toString("hex"),
};
const submit = (payload = p, s = secret) =>
  client.rpc("ig_submit_enquiry", { secret: s, p: payload });
const bad = await submit(p, "invalid");
assert.ok(bad.error);
console.log("PASS invalid ingestion secret denied");
assert.ok((await submit({ ...p, privacy: false })).error);
console.log("PASS privacy acknowledgement required");
const first = await submit();
assert.equal(first.error, null);
assert.equal(first.data.saved, true);
assert.equal(first.data.email_status, "awaiting_provider");
console.log("PASS enquiry persisted with honest delivery state");
const replay = await submit();
assert.equal(replay.error, null);
assert.equal(replay.data.id, first.data.id);
console.log("PASS identical retry returns existing enquiry");
assert.ok(
  (await submit({ ...p, message: "Changed payload must be rejected" })).error,
);
console.log("PASS changed payload cannot reuse a reference");
for (let i = 0; i < 4; i++)
  assert.equal(
    (await submit({ ...p, request_id: crypto.randomUUID() })).error,
    null,
  );
const limited = await submit({ ...p, request_id: crypto.randomUUID() });
assert.equal(limited.error?.code, "P0429");
console.log("PASS per-window rate limit enforced");
fs.writeFileSync(
  process.env.IG_ENQUIRY_QA_REPORT || "/tmp/ig-enquiry-qa.json",
  JSON.stringify({
    email: p.email,
    firstId: first.data.id,
    rateKey: p.rate_key,
  }),
);
console.log("Verified 6 live enquiry checks. No mail dispatched.");
