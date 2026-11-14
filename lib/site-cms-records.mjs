import {effectiveSnapshot,scheduledSnapshot} from "./site-schedules.mjs";
import { sectionLabel, siteDefaults, validateSection } from "./site-editorial.mjs";

export const sitePrefix = "website-editor-";
export const siteRecordSlugs = Object.keys(siteDefaults).map(key => sitePrefix + key);


export function parseSiteRecords(rows = [], {draft=false}={}) {
  const records = {};
  for (const row of rows) {
    const section = row.slug.slice(sitePrefix.length);
    try {
      const snap=effectiveSnapshot(section,row.version,JSON.parse(row.body),{draft,secret:process.env.INTEGRATION_MASTER_KEY});
      const content=snap.content===undefined?undefined:validateSection(section,snap.content);
      records[section] = { content, version: snap.version, live_version: row.published_version, ...(snap.scheduled_at?{scheduled_at:snap.scheduled_at}:{}) };
    } catch { /* Keep the last publicly approved template when a stored section is invalid. */ }
  }
  return records;
}

export async function readSiteRecords(client, table) {
  const draft = table === "ig_content";
  const { data, error } = await client.from(table)
    .select("slug,body,version" + (draft ? ",published_version" : ""))
    .eq("kind", "page").in("slug", siteRecordSlugs);
  if (error) throw new Error("Website sections could not be loaded.");
  return parseSiteRecords(data,{draft});
}

export async function writeSiteRecord(client, p) {
  const slug = sitePrefix + p.section;
  let body = JSON.stringify(p.content);
  const lookup = await client.from("ig_content").select("id,version,body")
    .eq("kind", "page").eq("slug", slug).maybeSingle();
  if (lookup.error) throw Error("The website section could not be opened.");
  let record = lookup.data;
  if ((record?.version || 0) !== p.version) throw Error("Another editor saved this section. Reload before saving.");
  if (p.action==="publish" && p.effective_at) {
    const at=Date.parse(p.effective_at);
    if (!Number.isFinite(at)) throw Error("Choose a valid publication time.");
    if (at>Date.now()) {
      const live=await client.from("ig_public_content").select("version,body").eq("kind","page").eq("slug",slug).maybeSingle();
      if(live.error)throw Error("The current live revision could not be checked.");
      const current=live.data?effectiveSnapshot(p.section,live.data.version,JSON.parse(live.data.body),{secret:process.env.INTEGRATION_MASTER_KEY}):null;
      body=JSON.stringify(scheduledSnapshot(p.section,p.version+1,p.content,new Date(at).toISOString(),current?.content?{content:current.content,version:current.version}:null,process.env.INTEGRATION_MASTER_KEY));
    }
  }
  if (body.length>100000) throw Error("This section exceeds the CMS text allowance.");
  if (!record || record.body !== body) {
    const saved = await client.rpc("ig_save_content", { p: {
      id: record?.id, version: p.version, kind: "page", practice: "corporate",
      slug, title: "Website · " + sectionLabel(p.section), body, public_data: {},
    } });
    if (saved.error) throw Error(saved.error.code === "23505" ? "Another editor saved this section. Reload before saving." : saved.error.message);
    record = saved.data;
  }
  if (p.action === "publish") {
    const release = await client.rpc("ig_content_action", { p: {
      id: record.id, version: record.version, action: "publish",
      factsConfirmed: p.reviewed, rightsConfirmed: p.reviewed, privacyConfirmed: p.reviewed,
    } });
    if (release.error) throw Error("Draft saved. " + release.error.message + " Reload before retrying publication.");
  }
  return { version: record.version };
}
