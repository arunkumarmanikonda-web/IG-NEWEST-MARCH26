import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const db = new PGlite({ extensions: { pgcrypto } });
let stage = "Local database setup";
try {
  await db.exec(await read("tests/fixtures/local-provider-schema.sql"));
  const migrations = await readdir(new URL("supabase/migrations/", root));
  for (const name of migrations.filter(name => name.endsWith(".sql")).sort()) {
    stage = name;
    const sql = await read("supabase/migrations/" + name);
    // The isolated runner has no scheduler or outbound HTTP.
    await db.exec(sql.replace(/^create extension if not exists pg_(?:cron|net) with schema [a-z_]+;/gim, ""));
  }
  stage = "Scheduled Gullu reports on a quiet day";
  // Migrations enqueue the first real report. Validate it in the in-memory database
  // before the independent queue-lease tests introduce their own report dates.
  await db.exec(`
    do $
    declare
      local_day date := (now() at time zone 'Asia/Kolkata')::date;
      recipients integer;
    begin
      perform ig_private.queue_gullu_daily();
      perform ig_private.queue_gullu_daily();
      select count(distinct recipient) into recipients from ig_private.gullu_reports
      where cadence='daily' and period_start=local_day-1 and next_at=(local_day+time '09:00') at time zone 'Asia/Kolkata';
      if recipients<>3 then raise exception 'Missing quiet-day reports or incorrect India delivery time'; end if;
      delete from ig_private.gullu_reports where cadence='daily' and period_start=local_day-1;
    end $;
  `);
  stage = "Business fixtures";
  await db.exec(await read("tests/fixtures/local-business-data.sql"));
  await db.exec(await read("supabase/seed.sql"));

  const scripts = await readdir(new URL("scripts/", root));
  for (const name of scripts.filter(name => /^verify-.*\.sql$/.test(name)).sort()) {
    stage = name;
    const raw = await read("scripts/" + name);
    // Routing asserts the business delivery addresses. Other scripts use synthetic test accounts.
    const sql = name === "verify-enquiry-routing.sql" ? raw : raw
      .replaceAll("akm@indiagully.com", "owner@example.invalid")
      .replaceAll("pavan@indiagully.com", "buyer@example.invalid");
    await db.exec(sql);
    console.log("Passed", name);
  }
} catch (error) {
  console.error(stage, error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
