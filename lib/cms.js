import { readRegister } from "./registers.mjs";
import { siteRecordSlugs } from "./site-cms-records.mjs";
import { refineLegacyProperty } from "./property-editorial.mjs";
import { contentPath } from "./content-routes.mjs";
import {isRetail,retailPromotionCard} from "./retail-mandates.mjs";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { siteConfig } from "./seo.mjs";
export const cmsConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export function publishedWithTags(client, kind, columns = "*") {
  // A left embed keeps untagged records. Staff may read retired terms, so both
  // the public register and its staff previews explicitly select active labels.
  const query=client.from("ig_public_content").select(columns + ",tags:ig_taxonomy!ig_public_tags(id,slug,label,dimension)");
  return (Array.isArray(kind)?query.in("kind",kind):query.eq("kind", kind)).eq("tags.active", true);
}

export async function publishedListingCard(client, id) {
  const { data, error } = await publishedWithTags(client, ["opportunity","retail_space","retail_requirement"], "kind,slug,title,summary,public_data")
    .eq("id", id).maybeSingle();
  return { data: data ? isRetail(data.kind)?retailPromotionCard(data):opportunityCard(refineLegacyProperty(data)) : null, error };
}

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
  const {data,error} = await readRegister(() => publishedWithTags(client, kind), "published_at");
  if (error) throw new Error("Published content is temporarily unavailable.");
  return data.filter(x => x.kind !== "page" || !siteRecordSlugs.includes(x.slug)).map(refineLegacyProperty);
});
export const publishedBySlug=cache(async(kind,slug)=>{
  if(!cmsConfigured())return null;
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false},global:{fetch:(u,o)=>fetch(u,{...o,cache:'no-store'})}});
  const {data,error}=await publishedWithTags(client,kind).eq('slug',slug).maybeSingle();
  if(error)throw new Error('Published item unavailable');return data?refineLegacyProperty(data):null;
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
    title = (x.seo_title || x.title)+(x.kind==='product'&&x.public_data.sku?' | SKU '+x.public_data.sku:''),
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
export function opportunityCard(x, feature = null) {
  const d = x.public_data;
  return {
    slug: x.slug,
    title: x.title,
    feature: feature && typeof feature === "object" ? feature : null,
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
