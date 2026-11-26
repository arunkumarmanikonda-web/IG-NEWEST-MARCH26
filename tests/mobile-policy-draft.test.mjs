import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { initialPolicies } from '../lib/legal-content.mjs';

const require = createRequire(import.meta.url);
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
const migration = await readFile(new URL('../supabase/migrations/20261126183000_mobile_policy_draft.sql', import.meta.url), 'utf8');
const draftVersion = '2026-11-26.mobile-draft.1';
const baselineHash = '62acfad3240828407e1829165202b82ff4fe910f4e10ae2aef7e3dc5e13e99c1';

async function fixture(published = true) {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create schema extensions;
    create extension pgcrypto with schema extensions;
    create role anon;
    create table public.ig_policy_releases (
      version text primary key, documents jsonb not null, sha256 text not null,
      current boolean not null default false, legal_reviewed boolean not null default false
    );
    create unique index ig_policy_current on public.ig_policy_releases(current) where current;
    alter table public.ig_policy_releases enable row level security;
    grant select on public.ig_policy_releases to anon;
    create policy public_policy on public.ig_policy_releases for select to anon using(current and legal_reviewed);
  `);
  await db.query(`insert into public.ig_policy_releases(version,documents,sha256,current,legal_reviewed)
    values('2026-11-11.2',$1::jsonb,encode(extensions.digest(convert_to(($1::jsonb)::text,'UTF8'),'sha256'),'hex'),$2,$2)`,
  [JSON.stringify(initialPolicies), published]);
  return db;
}

test('staging preserves the active release and changes only the two intended document bodies', async () => {
  const db = await fixture();
  try {
    const before = (await db.query('select * from public.ig_policy_releases')).rows[0];
    assert.equal(before.sha256, baselineHash);
    await db.exec(migration);
    const old = (await db.query("select * from public.ig_policy_releases where version='2026-11-11.2'")).rows[0];
    assert.deepEqual(old, before);
    const draft = (await db.query('select * from public.ig_policy_releases where version=$1', [draftVersion])).rows[0];
    assert.equal(draft.current, false);
    assert.equal(draft.legal_reviewed, false);
    assert.notEqual(draft.sha256, old.sha256);
    for (const [name, document] of Object.entries(old.documents)) {
      assert.equal(draft.documents[name].title, document.title);
      if (!['privacy', 'dataUse'].includes(name)) assert.deepEqual(draft.documents[name], document);
    }
    assert.match(draft.documents.privacy.body, /native shortlist is not uploaded/);
    assert.match(draft.documents.privacy.body, /clearing local app data alone does not delete an account/);
    assert.doesNotMatch(draft.documents.privacy.body, /Registered users are asked to acknowledge the current/);
    assert.match(draft.documents.dataUse.body, /does not create an NDA signature/);
    assert.match(draft.documents.dataUse.body, /grant access before NDA signing/);
    await db.exec('set role anon');
    assert.deepEqual((await db.query('select version from public.ig_policy_releases')).rows, [{version:'2026-11-11.2'}]);
  } finally { await db.close(); }
});

test('the draft is safe on clean installation and reapplication cannot reactivate an older release', async () => {
  const db = await fixture(false);
  try {
    await db.exec(migration);
    assert.equal((await db.query('select count(*)::int as count from public.ig_policy_releases where current')).rows[0].count, 0);
    await db.query(`insert into public.ig_policy_releases select '2026-12-01.1',documents,sha256,true,true from public.ig_policy_releases where version=$1`, [draftVersion]);
    await db.exec(migration);
    assert.deepEqual((await db.query('select version from public.ig_policy_releases where current')).rows, [{version:'2026-12-01.1'}]);
    assert.equal((await db.query('select count(*)::int as count from public.ig_policy_releases')).rows[0].count, 3);
  } finally { await db.close(); }
});

test('changed source, conflicting draft and a newer active policy fail without overwriting records', async () => {
  for (const scenario of ['base', 'collision', 'newer']) {
    const db = await fixture();
    try {
      if (scenario === 'base') await db.exec("update public.ig_policy_releases set documents=jsonb_set(documents,'{privacy,body}','\"Changed notice\"')");
      if (scenario === 'collision') await db.query(`insert into public.ig_policy_releases select $1,documents,sha256,false,false from public.ig_policy_releases`, [draftVersion]);
      if (scenario === 'newer') {
        await db.exec('update public.ig_policy_releases set current=false');
        await db.exec("insert into public.ig_policy_releases select '2026-12-01.1',documents,sha256,true,true from public.ig_policy_releases");
      }
      const before = (await db.query('select * from public.ig_policy_releases order by version')).rows;
      await assert.rejects(db.exec(migration), /differs|different state|different policy/i);
      assert.deepEqual((await db.query('select * from public.ig_policy_releases order by version')).rows, before);
    } finally { await db.close(); }
  }
});
