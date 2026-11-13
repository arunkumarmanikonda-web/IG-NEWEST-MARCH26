// Run against an isolated preview project with disposable, pre-verified fixtures.
// This tests Auth, MFA and PostgREST/RLS. It does not test email verification delivery.
import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const fixturePath = process.env.IG_QA_FIXTURES;
if (!fixturePath)
  throw new Error(
    "Set IG_QA_FIXTURES to a temporary JSON file outside the repository.",
  );
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const make = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let count = 0;
const pass = (name) => {
  count++;
  console.log("PASS " + name);
};
function ok(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
async function deny(result, name) {
  assert.ok(result.error, name + " must fail");
  pass(name);
}
function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=+$/, ""))
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = Buffer.from(bits.match(/.{8}/g).map((x) => parseInt(x, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = crypto.createHmac("sha1", bytes).update(counter).digest(),
    offset = digest[19] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1e6)
    .toString()
    .padStart(6, "0");
}
const sessions = {};
const anon = make();
await deny(
  await anon.from("ig_content").select("*"),
  "Anonymous draft access denied",
);
await deny(
  await anon.from("ig_profiles").select("*"),
  "Anonymous profile access denied",
);
assert.ok(ok(await anon.from("ig_public_content").select("id")).length >= 7);
pass("Published content readable anonymously");
assert.ok(ok(await anon.from("ig_taxonomy").select("id")).length >= 10);
pass("Public categories readable");
for (const fixture of fixtures) {
  const client = make();
  ok(
    await client.auth.signInWithPassword({
      email: fixture.email,
      password: fixture.password,
    }),
  );
  const profile = ok(
    await client.from("ig_profiles").select("*").eq("id", fixture.id).single(),
  );
  assert.deepEqual(profile.roles, [fixture.role]);
  pass(fixture.role + " password sign-in and trusted role");
  await deny(
    await client.rpc("ig_admin_overview"),
    "Staff access denied before policy acceptance and MFA (" +
      fixture.role +
      ")",
  );
  ok(
    await client.rpc("ig_account_update", {
      p: {
        action: "accept_policies",
        version: "2026-11-11",
        terms: true,
        privacy: true,
        dataUse: true,
      },
    }),
  );
  await deny(
    await client
      .from("ig_profiles")
      .update({ roles: ["owner"] })
      .eq("id", fixture.id),
    "Direct role mutation denied (" + fixture.role + ")",
  );
  if (fixture.role !== "client") {
    const factors = ok(await client.auth.mfa.listFactors());
    for (const f of factors.all)
      ok(await client.auth.mfa.unenroll({ factorId: f.id }));
    const factor = ok(
      await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Disposable QA",
      }),
    );
    ok(
      await client.auth.mfa.challengeAndVerify({
        factorId: factor.id,
        code: totp(factor.totp.secret),
      }),
    );
    ok(await client.rpc("ig_admin_overview"));
    pass(fixture.role + " TOTP MFA and staff access");
  }
  sessions[fixture.role] = client;
}
const owner = sessions.owner,
  editor = sessions.editor,
  property = sessions.property_manager,
  client = sessions.client;
assert.deepEqual(ok(await client.from("ig_content").select("*")), []);
pass("Client cannot read drafts despite injected user_metadata role");
const base = {
  kind: "article",
  slug: "qa-" + crypto.randomUUID(),
  title: "Temporary QA content",
  summary: "Test record. Removed after verification.",
  body: "Test body",
  public_data: {},
  term_ids: [],
};
let article = ok(await editor.rpc("ig_save_content", { p: base }));
pass("Editor creates allowed content");
await deny(
  await editor.rpc("ig_save_content", {
    p: { ...base, kind: "opportunity", slug: "qa-forbidden" },
  }),
  "Editor cannot create property listings",
);
await deny(
  await property.rpc("ig_save_content", {
    p: { ...base, slug: "qa-forbidden" },
  }),
  "Property manager cannot create articles",
);
await deny(
  await editor.rpc("ig_content_action", {
    p: {
      id: article.id,
      version: article.version,
      action: "publish",
      factsConfirmed: true,
      rightsConfirmed: true,
      privacyConfirmed: true,
    },
  }),
  "Editor cannot publish",
);
assert.deepEqual(
  ok(await anon.from("ig_public_content").select("id").eq("id", article.id)),
  [],
);
pass("New draft absent from public snapshot");
await deny(
  await owner.rpc("ig_content_action", {
    p: { id: article.id, version: article.version, action: "publish" },
  }),
  "Publication requires review confirmations",
);
ok(
  await owner.rpc("ig_content_action", {
    p: {
      id: article.id,
      version: article.version,
      action: "publish",
      factsConfirmed: true,
      rightsConfirmed: true,
      privacyConfirmed: true,
    },
  }),
);
assert.equal(
  ok(
    await anon
      .from("ig_public_content")
      .select("title")
      .eq("id", article.id)
      .single(),
  ).title,
  base.title,
);
pass("Approved publication visible publicly");
article = ok(
  await editor.rpc("ig_save_content", {
    p: {
      ...base,
      id: article.id,
      version: article.version,
      title: "New unpublished revision",
    },
  }),
);
assert.equal(
  ok(
    await anon
      .from("ig_public_content")
      .select("title")
      .eq("id", article.id)
      .single(),
  ).title,
  base.title,
);
pass("Draft revision does not overwrite published snapshot");
await deny(
  await editor.rpc("ig_save_content", {
    p: { ...base, id: article.id, version: 1 },
  }),
  "Stale update prevented",
);
await deny(
  await owner.rpc("ig_content_action", {
    p: {
      action: "publish",
      id: article.id,
      version: 1,
      factsConfirmed: true,
      rightsConfirmed: true,
      privacyConfirmed: true,
    },
  }),
  "Stale publication prevented",
);
await deny(
  await property.rpc("ig_save_content", {
    p: {
      ...base,
      kind: "opportunity",
      slug: "qa-confidential",
      public_data: { confidential: true },
    },
  }),
  "Confidential asset requires opaque slug",
);
await deny(
  await property.rpc("ig_save_content", {
    p: {
      ...base,
      kind: "opportunity",
      slug: "ig-opp-qa",
      public_data: { exact_address: "Private address" },
    },
  }),
  "Private fields rejected from public metadata",
);
const taxonomy = ok(
  await owner.rpc("ig_taxonomy_action", {
    p: {
      action: "create",
      dimension: "opportunity-context",
      slug: "qa-" + crypto.randomUUID(),
      label: "Temporary QA category",
    },
  }),
);
const term = ok(
  await owner.from("ig_taxonomy").select("*").eq("id", taxonomy.id).single(),
);
article = ok(
  await editor.rpc("ig_save_content", {
    p: {
      ...base,
      id: article.id,
      version: article.version,
      term_ids: [term.id],
    },
  }),
);
await deny(
  await owner.rpc("ig_taxonomy_action", {
    p: { action: "delete", id: term.id, version: term.version },
  }),
  "Referenced category deletion blocked",
);
ok(
  await owner.rpc("ig_taxonomy_action", {
    p: {
      action: "update",
      id: term.id,
      version: term.version,
      label: "Updated test category",
      description: "",
      active: true,
    },
  }),
);
pass("Category update saved");
await deny(
  await owner.rpc("ig_users_action", {
    p: { action: "close", id: fixtures.find((x) => x.role === "owner").id },
  }),
  "Last active owner cannot be closed",
);
const invite = ok(
  await owner.rpc("ig_users_action", {
    p: {
      action: "invite",
      email: "qa-pending@example.invalid",
      roles: ["editor"],
    },
  }),
);
assert.ok(invite.ok);
pass("Staff invitation saved without sending email");
const users = ok(await owner.rpc("ig_admin_users"));
const invitation = users.invitations.find(
  (x) => x.email === "qa-pending@example.invalid",
);
ok(await owner.rpc("ig_revoke_invitation", { p: { id: invitation.id } }));
pass("Invitation can be revoked");
ok(
  await client.rpc("ig_account_update", {
    p: {
      action: "consent",
      purpose: "email_marketing",
      granted: true,
      practices: ["hospitality"],
    },
  }),
);
ok(
  await client.rpc("ig_account_update", {
    p: {
      action: "consent",
      purpose: "email_marketing",
      granted: false,
      practices: [],
    },
  }),
);
const consents = ok(
  await client
    .from("ig_consents")
    .select("granted")
    .eq("purpose", "email_marketing")
    .order("id", { ascending: false }),
);
assert.equal(consents[0].granted, false);
assert.equal(consents[1].granted, true);
pass("Consent grant and withdrawal retained");
ok(
  await owner.rpc("ig_content_action", {
    p: { action: "archive", id: article.id, version: article.version },
  }),
);
assert.deepEqual(
  ok(await anon.from("ig_public_content").select("id").eq("id", article.id)),
  [],
);
pass("Archive removes published content");
ok(
  await owner.rpc("ig_content_action", {
    p: { action: "delete", id: article.id, version: article.version },
  }),
);
pass("Archived content can be deleted");
const updatedTerm = ok(
  await owner.from("ig_taxonomy").select("*").eq("id", term.id).single(),
);
ok(
  await owner.rpc("ig_taxonomy_action", {
    p: { action: "delete", id: term.id, version: updatedTerm.version },
  }),
);
pass("Unreferenced category can be deleted");
ok(
  await owner.rpc("ig_users_action", {
    p: {
      action: "revoke_sessions",
      id: fixtures.find((x) => x.role === "editor").id,
    },
  }),
);
await deny(
  await editor.rpc("ig_admin_overview"),
  "Revoked session immediately loses staff access",
);
assert.deepEqual(ok(await editor.from("ig_content").select("id")), []);
pass("Revoked token cannot read protected content");
for (const s of Object.values(sessions))
  await s.auth.signOut({ scope: "global" });
console.log(
  `Verified ${count} live checks. Temporary fixtures must be removed by the test operator.`,
);
