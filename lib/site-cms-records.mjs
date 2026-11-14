import { sectionLabel, siteDefaults, validateSection } from "./site-editorial.mjs";

export const sitePrefix = "website-editor-";
export const siteRecordSlugs = Object.keys(siteDefaults).map(key => sitePrefix + key);
export const schemaUnavailable = error => error?.code === "PGRST202" || error?.code === "42883";

export function parseSiteRecords(rows = []) {
  const records = {};
  for (const row of rows) {
    const section = row.slug.slice(sitePrefix.length);
    try {
      const content = validateSection(section, JSON.parse(row.body));
      records[section] = { content, version: row.version, live_version: row.published_version };
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
  return parseSiteRecords(data);
}

export async function writeSiteRecord(client, p) {
  const slug = sitePrefix + p.section;
  const body = JSON.stringify(p.content);
  if (body.length > 100000) throw Error("This section exceeds the CMS text allowance.");
  if (p.effective_at && Date.parse(p.effective_at) > Date.now()) throw Error("Scheduled publication is awaiting database activation.");
  const lookup = await client.from("ig_content").select("id,version,body")
    .eq("kind", "page").eq("slug", slug).maybeSingle();
  if (lookup.error) throw Error("The website section could not be opened.");
  let record = lookup.data;
  if ((record?.version || 0) !== p.version) throw Error("Another editor saved this section. Reload before saving.");
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
