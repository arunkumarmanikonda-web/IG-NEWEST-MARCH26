// Disposable preview-only integration verification. Never use real client credentials.
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { roomPreview } from "../lib/render-room-preview.mjs";
const fixturePath = process.env.IG_ROOM_QA;
if (!fixturePath)
  throw new Error(
    "Set IG_ROOM_QA to disposable fixtures outside the repository",
  );
const cfg = JSON.parse(fs.readFileSync(fixturePath, "utf8")),
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secret = process.env.DATAROOM_BROKER_SECRET;
const save = () => fs.writeFileSync(fixturePath, JSON.stringify(cfg));
cfg.progress ??= {};
let checks = 0;
const pass = (m) => {
    checks++;
    console.log("PASS " + m);
  },
  ok = (r) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  },
  deny = (r, m) => {
    assert.ok(r.error, m);
    pass(m);
  };
const clients = {};
const make = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
function totp(secret) {
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, ""))
    bits += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
      .indexOf(c)
      .toString(2)
      .padStart(5, "0");
  const b = Buffer.from(bits.match(/.{8}/g).map((x) => parseInt(x, 2)));
  const t = Buffer.alloc(8);
  t.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac("sha1", b).update(t).digest(),
    i = h[19] & 15;
  return ((h.readUInt32BE(i) & 0x7fffffff) % 1e6).toString().padStart(6, "0");
}
for (const f of cfg.fixtures) {
  const c = make();
  ok(await c.auth.signInWithPassword({ email: f.email, password: f.password }));
  ok(
    await c.rpc("ig_account_update", {
      p: {
        action: "accept_policies",
        version: "2026-11-11",
        terms: true,
        privacy: true,
        dataUse: true,
      },
    }),
  );
  if (["owner", "administrator"].includes(f.role)) {
    const factors = ok(await c.auth.mfa.listFactors());
    const existing = factors.all.find((x) => x.status === "verified");
    if (existing && f.mfaSecret)
      ok(
        await c.auth.mfa.challengeAndVerify({
          factorId: existing.id,
          code: totp(f.mfaSecret),
        }),
      );
    for (const factor of factors.all)
      ok(await c.auth.mfa.unenroll({ factorId: factor.id }));
    const factor = ok(
      await c.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Disposable room QA",
      }),
    );
    f.mfaSecret = factor.totp.secret;
    save();
    ok(
      await c.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: totp(factor.totp.secret),
      }),
    );
  }
  if (f.role === "owner") {
    const profile = ok(
      await c.from("ig_profiles").select("*").eq("id", f.id).single(),
    );
    if (profile.must_change_password) {
      deny(
        await c.rpc("ig_admin_overview"),
        "Initial password blocks staff access even with MFA",
      );
      deny(
        await c
          .from("ig_profiles")
          .update({ must_change_password: false })
          .eq("id", f.id),
        "Client cannot clear initial-password gate",
      );
      const password =
        "Qa!" + crypto.randomBytes(24).toString("base64url") + "9";
      ok(await c.auth.updateUser({ password }));
      f.password = password;
      save();
      assert.equal(
        ok(
          await c
            .from("ig_profiles")
            .select("must_change_password")
            .eq("id", f.id)
            .single(),
        ).must_change_password,
        false,
      );
      pass("Real Auth password rotation clears the trusted gate");
    }
    ok(await c.rpc("ig_admin_overview"));
  }
  clients[f.role] = c;
}
const owner = clients.owner,
  admin = clients.administrator,
  client = clients.client,
  outsider = clients.outsider,
  anon = make();
const rpc = (c, name, p) => c.rpc(name, { p });
const broker = async (c, p, withSecret = true) => {
  const token = (await c.auth.getSession()).data.session.access_token;
  return fetch(url + "/functions/v1/ig-room-broker", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(withSecret ? { "x-room-broker": secret } : {}),
    },
    body: JSON.stringify(p),
  });
};
deny(
  await anon.from("ig_room_files").select("*"),
  "Anonymous file metadata denied",
);
assert.deepEqual(ok(await client.from("ig_room_files").select("*")), []);
pass("Unshared client cannot enumerate files");
const tag = crypto.randomUUID().slice(0, 8);
let opportunity = ok(
  await rpc(owner, "ig_save_content", {
    kind: "opportunity",
    slug: "qa-room-" + tag,
    title: "Disposable room verification " + tag,
    summary: "Test fixture, removed after verification.",
    body: "Test information only.",
    public_data: { city: "Noida" },
    term_ids: [],
  }),
);
cfg.progress.content = opportunity.id;
save();
ok(
  await rpc(owner, "ig_content_action", {
    action: "publish",
    id: opportunity.id,
    version: opportunity.version,
    factsConfirmed: true,
    rightsConfirmed: true,
    privacyConfirmed: true,
  }),
);
let template = ok(
  await rpc(owner, "ig_nda_admin", {
    action: "template_create",
    version: "qa-" + tag,
    title: "Disposable QA agreement",
    body: "This is synthetic test content for automated verification only. It has no application to any real opportunity, client or transaction. No legal commitment is intended. ".repeat(
      3,
    ),
  }),
);
cfg.progress.template = template.id;
save();
deny(
  await rpc(admin, "ig_nda_admin", {
    action: "template_publish",
    id: template.id,
    legal_reviewed: true,
  }),
  "Administrator cannot activate legal templates",
);
deny(
  await rpc(owner, "ig_nda_admin", {
    action: "template_publish",
    id: template.id,
  }),
  "Legal publication requires explicit review",
);
template = ok(
  await rpc(owner, "ig_nda_admin", {
    action: "template_publish",
    id: template.id,
    legal_reviewed: true,
  }),
);
let request = ok(
  await rpc(client, "ig_nda_action", {
    action: "request",
    slug: opportunity.slug,
    purpose:
      "Disposable automated verification of controlled document disclosure.",
  }),
);
cfg.progress.request = request.id;
save();
assert.equal(
  ok(
    await rpc(client, "ig_nda_action", {
      action: "request",
      slug: opportunity.slug,
      purpose: "Repeated disposable test request.",
    }),
  ).id,
  request.id,
);
pass("Repeated project request is idempotent");
deny(
  await rpc(outsider, "ig_nda_action", {
    action: "accept",
    id: request.id,
    version: request.version,
    template_id: template.id,
    signed_name: "QA",
    agreed: true,
    authority: true,
  }),
  "Another client cannot sign someone else’s request",
);
deny(
  await rpc(admin, "ig_nda_admin", {
    action: "review",
    id: request.id,
    version: request.version,
    status: "approved",
  }),
  "Unsigned NDA cannot be approved",
);
request = ok(
  await rpc(client, "ig_nda_action", {
    action: "accept",
    id: request.id,
    version: request.version,
    template_id: template.id,
    signed_name: "Disposable QA Recipient",
    organisation: "Test only",
    agreed: true,
    authority: true,
  }),
);
assert.equal(
  request.agreement_snapshot.sha256,
  crypto.createHash("sha256").update(template.body).digest("hex"),
);
assert.equal(request.agreement_snapshot.body, template.body);
pass("Receipt preserves exact agreement text and independent SHA-256");
assert.deepEqual(ok(await outsider.from("ig_nda_requests").select("*")), []);
pass("NDA receipts are private to the correct client");
request = ok(
  await rpc(admin, "ig_nda_admin", {
    action: "review",
    id: request.id,
    version: request.version,
    status: "approved",
    note: "Disposable test approval",
  }),
);
let room = ok(
  await rpc(owner, "ig_room_manage", {
    action: "create",
    content_id: opportunity.id,
    title: "Disposable QA room",
  }),
);
cfg.progress.room = room.id;
save();
deny(
  await rpc(client, "ig_room_manage", {
    action: "folder_create",
    room_id: room.id,
    path: "Not allowed",
  }),
  "Client cannot create folders",
);
ok(
  await rpc(admin, "ig_room_manage", {
    action: "folder_create",
    room_id: room.id,
    path: "Legal/Title documents",
  }),
);
assert.equal(
  ok(await admin.from("ig_room_folders").select("id").eq("room_id", room.id))
    .length,
  2,
);
pass("Nested folder creation preserves parent hierarchy");
deny(
  await rpc(admin, "ig_room_manage", {
    action: "folder_create",
    room_id: room.id,
    path: "../escape",
  }),
  "Folder traversal rejected",
);
let grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "grant",
    room_id: room.id,
    nda_request_id: request.id,
    download_mode: "none",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  }),
);
cfg.progress.grant = grant.id;
save();
assert.equal(
  ok(await rpc(client, "ig_room_dashboard", {})).find((x) => x.id === room.id)
    .title,
  room.title,
);
pass("Shared room is activated in the correct client dashboard");
assert.deepEqual(ok(await rpc(outsider, "ig_room_dashboard", {})), []);
pass("Unshared client has no room link");
const original = fs.readFileSync("public/images/prism.jpg");
let response = await broker(admin, {
  action: "prepare",
  room_id: room.id,
  name: "QA-image.jpg",
  folder: "Legal/Title documents",
  mime: "image/jpeg",
  bytes: original.length,
  download_enabled: true,
});
let prepared = await response.json();
assert.equal(response.status, 200, JSON.stringify(prepared));
cfg.progress.object = prepared.path;
cfg.progress.file = prepared.id;
save();
ok(
  await admin.storage
    .from("ig-data-rooms")
    .uploadToSignedUrl(prepared.path, prepared.token, original, {
      contentType: "image/jpeg",
    }),
);
response = await broker(admin, {
  action: "complete",
  id: prepared.id,
  version: prepared.version,
});
assert.equal(response.status, 200, await response.text());
pass("Signed upload, private storage and content validation work end to end");
deny(
  await client.storage.from("ig-data-rooms").download(prepared.path),
  "Direct original storage access denied",
);
response = await broker(
  client,
  { action: "preview_source", id: prepared.id },
  false,
);
assert.equal(response.status, 403);
pass("Client cannot fetch raw preview source without server credential");
response = await broker(client, { action: "download", id: prepared.id });
assert.equal(response.status, 403);
pass("View-only grant blocks original download at the server");
response = await broker(client, { action: "preview_source", id: prepared.id });
assert.equal(response.status, 200, await response.clone().text());
const preview = await roomPreview(
  await response.arrayBuffer(),
  "image/jpeg",
  1,
  "QA recipient",
);
assert.ok(preview.data.length > 1000);
assert.notDeepEqual(Buffer.from(preview.data), original);
pass("Authorised source renders into a watermarked image");
response = await broker(outsider, {
  action: "preview_source",
  id: prepared.id,
});
assert.equal(response.status, 403);
pass("Server credential does not bypass client project permission");
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "grant_update",
    id: grant.id,
    version: grant.version,
    active: true,
    download_mode: "selected",
    expires_at: grant.expires_at,
  }),
);
response = await broker(client, { action: "download", id: prepared.id });
assert.equal(response.status, 403);
pass("Selected mode denies files without an explicit allow rule");
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "file_rule",
    grant_id: grant.id,
    version: grant.version,
    file_id: prepared.id,
    rule: "allow",
  }),
);
response = await broker(client, { action: "download", id: prepared.id });
const download = await response.json();
assert.equal(response.status, 200, JSON.stringify(download));
assert.equal(new URL(download.url).origin, new URL(url).origin);
const downloaded = await fetch(download.url);
assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), original);
pass("Explicit per-file permission enables the correct original");
let file = ok(
  await admin.from("ig_room_files").select("*").eq("id", prepared.id).single(),
);
file = ok(
  await rpc(admin, "ig_room_manage", {
    action: "file_update",
    id: file.id,
    version: file.version,
    status: "ready",
    download_enabled: false,
  }),
);
response = await broker(client, { action: "download", id: prepared.id });
assert.equal(response.status, 403);
pass("File-level download block overrides a client allow rule");
file = ok(
  await rpc(admin, "ig_room_manage", {
    action: "file_update",
    id: file.id,
    version: file.version,
    status: "ready",
    download_enabled: true,
  }),
);
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "grant_update",
    id: grant.id,
    version: grant.version,
    active: true,
    download_mode: "all",
    expires_at: grant.expires_at,
  }),
);
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "file_rule",
    grant_id: grant.id,
    version: grant.version,
    file_id: prepared.id,
    rule: "deny",
  }),
);
response = await broker(client, { action: "download", id: prepared.id });
assert.equal(response.status, 403);
pass("Per-client deny overrides all-files mode");
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "file_rule",
    grant_id: grant.id,
    version: grant.version,
    file_id: prepared.id,
    rule: "inherit",
  }),
);
assert.equal(
  (await broker(client, { action: "download", id: prepared.id })).status,
  200,
);
pass("All-files mode permits eligible originals");
deny(
  await rpc(admin, "ig_room_manage", {
    action: "grant_update",
    id: grant.id,
    version: grant.version - 1,
    active: true,
    download_mode: "all",
    expires_at: grant.expires_at,
  }),
  "Stale permission updates cannot overwrite newer decisions",
);
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "grant_update",
    id: grant.id,
    version: grant.version,
    active: false,
    download_mode: "none",
    expires_at: grant.expires_at,
  }),
);
assert.deepEqual(ok(await rpc(client, "ig_room_dashboard", {})), []);
assert.equal(
  (await broker(client, { action: "preview_source", id: prepared.id })).status,
  403,
);
pass("Grant revocation immediately removes room and blocks new previews");
grant = ok(
  await rpc(admin, "ig_room_manage", {
    action: "grant_update",
    id: grant.id,
    version: grant.version,
    active: true,
    download_mode: "none",
    expires_at: grant.expires_at,
  }),
);
request = ok(
  await rpc(client, "ig_nda_action", {
    action: "withdraw",
    id: request.id,
    version: request.version,
  }),
);
assert.deepEqual(ok(await rpc(client, "ig_room_dashboard", {})), []);
pass("Withdrawing project NDA request also removes room access");
ok(
  await rpc(owner, "ig_nda_admin", {
    action: "template_retire",
    id: template.id,
  }),
);
const receipt = ok(
  await client.from("ig_nda_templates").select("id").eq("id", template.id),
);
assert.equal(receipt.length, 1);
pass("Original signatory retains access to retired agreement version");
for (const [role, c] of Object.entries(clients)) {
  cfg.fixtures.find((x) => x.role === role).session = (
    await c.auth.getSession()
  ).data.session;
}
save();
console.log(
  "Completed " +
    checks +
    " data-room integration checks. Disposable fixtures must now be removed.",
);
