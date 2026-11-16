import { readRegister } from "./registers.mjs";
import { siteRecordSlugs } from "./site-cms-records.mjs";
import { refineLegacyProperty } from "./property-editorial.mjs";
import { contentPath } from "./content-routes.mjs";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { siteConfig } from "./seo.mjs";
export const cmsConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export const published = cache(async function (kind) {
  if (!cmsConfigured()) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );
  const [{data,error},{data:terms,error:termError}] = await Promise.all([
    readRegister(() => client.from("ig_public_content").select("*,ig_public_tags(term_id)").eq("kind",kind), "published_at"),
    readRegister(() => client.from("ig_taxonomy").select("id,slug,label,dimension").eq("active",true)),
  ]);
  if (error || termError) throw new Error("Published content is temporarily unavailable.");
  const termMap = new Map(terms.map(t => [t.id,t]));
  return data.filter(x => x.kind !== "page" || !siteRecordSlugs.includes(x.slug)).map(({ig_public_tags,...x}) => ({
    ...refineLegacyProperty(x),
    tags: (ig_public_tags || []).map(t => termMap.get(t.term_id)).filter(Boolean),
  }));
});
export { contentPath } from "./content-routes.mjs";
export async function publishedIndex() {
  if (!cmsConfigured()) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );
  const { data, error } = await readRegister(() => client.from("ig_public_content").select("id,kind,slug,published_at"));
  if (error) throw new Error("Published index is temporarily unavailable.");
  return data.filter(x => x.kind !== "page" || !siteRecordSlugs.includes(x.slug));
}
export function cmsMetadata(x) {
  if (!x)
    return { title: "Page not found", robots: { index: false, follow: false } };
  const { origin, indexable } = siteConfig();
  const url = origin + contentPath(x),
    title = x.seo_title || x.title,
    description = x.seo_description || x.summary;
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: x.public_data.seo_keywords || undefined,
    robots: { index: indexable, follow: indexable },
    openGraph: {
      title,
      description,
      url,
      type: x.kind === "article" ? "article" : "website",
      images: x.public_data.image ? [origin + x.public_data.image] : [],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
export function opportunityCard(x) {
  const d = x.public_data;
  return {
    slug: x.slug,
    title: x.title,
    description: x.summary,
    location:
      [d.city, d.region].filter(Boolean).join(", ") || "Location on enquiry",
    sector: d.sector || d.asset_class || "Real estate",
    type: d.transaction_type || d.asset_class || "Investment opportunity",
    image: d.image || null,
    tags: x.tags,
    contexts: x.tags
      .filter((t) => t.dimension === "opportunity-context")
      .map((t) => t.slug),
    imageAlt: d.image_alt || x.title,
    reference: d.reference || "",
    assetClass: d.asset_class || "",
    transaction: d.transaction_type || "",
    price: d.price_label || "",
    availability: d.availability || "",
    area: d.area || "", areaUnit: d.area_unit || "", keys: d.keys || "", tenure: d.tenure || "",
    focus: [],
  };
}

export const publishedSearchRecords = cache(async function () {
  if (!cmsConfigured()) return [];
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await readRegister(() => client.from("ig_public_content").select("id,kind,slug,title,summary,body,public_data"));
  if (error) throw new Error("Search is temporarily unavailable.");
  return data.filter(x => x.kind !== "page" || !siteRecordSlugs.includes(x.slug));
});

// Fetch just the requested public record for direct PDF downloads. The public
// snapshot is checked on every request so unpublished listings stay unavailable.
export async function publishedItem(kind, slug) {
  if (!cmsConfigured()) return null;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
  });
  const { data, error } = await client.from('ig_public_content').select('*').eq('kind', kind).eq('slug', slug).maybeSingle();
  if (error) throw new Error('Property information is temporarily unavailable.');
  return data ? refineLegacyProperty(data) : null;
}
