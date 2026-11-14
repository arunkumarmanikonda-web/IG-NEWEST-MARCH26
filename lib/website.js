import "server-only";
import { cache, Fragment, createElement } from "react";
import { createClient } from "@supabase/supabase-js";
import { readSiteRecords } from "./site-cms-records.mjs";
import { cmsConfigured, published } from "./cms";
import { siteDefaults, validateSection } from "./site-editorial.mjs";

const readWebsite = cache(async () => {
  if (!cmsConfigured()) return {};
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) },
  });
  const records=await readSiteRecords(client,"ig_public_content");
  return Object.fromEntries(Object.entries(records).map(([key,row])=>[key,row.content]));
});
export async function siteSection(key) {
  const content = await readWebsite();
  if (content[key] !== undefined) {
    try { return validateSection(key, content[key]); } catch { console.error("Invalid website section", key); }
  }
  return siteDefaults[key];
}
export const livePractices = cache(async () => {
  const [profiles, records] = await Promise.all([siteSection("disciplines"), published("practice")]);
  const result = new Map(profiles.map(p => [p.slug, p]));
  for (const row of records || []) {
    const base = result.get(row.slug);
    result.set(row.slug, { ...base, slug: row.slug, href: "/practices/" + row.slug, title: row.title,
      line: row.seo_title || base?.line || row.title, intro: row.summary || base?.intro || "",
      audience: base?.audience || "", image: row.public_data?.image || base?.image || "/images/city.jpg",
      body: row.body, services: base?.services || [], outputs: base?.outputs || [], record: row });
  }
  return [...result.values()];
});
export function renderSections(order, blocks) {
  return order.map(id => createElement(Fragment, { key: id }, blocks[id]));
}
