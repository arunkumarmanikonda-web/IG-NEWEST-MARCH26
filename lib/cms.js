import {contentPath} from "./content-routes.mjs";
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
  const [
    { data, error },
    { data: terms, error: termError },
    { data: tags, error: tagError },
  ] = await Promise.all([
    client
      .from("ig_public_content")
      .select("*")
      .eq("kind", kind)
      .order("published_at", { ascending: false })
      .limit(1000),
    client
      .from("ig_taxonomy")
      .select("id,slug,label,dimension")
      .eq("active", true),
    client.from("ig_public_tags").select("content_id,term_id").limit(10000),
  ]);
  if (error || termError || tagError)
    throw new Error("Published content is temporarily unavailable.");
  const termMap = new Map(terms.map((t) => [t.id, t]));
  return data.map((x) => ({
    ...x,
    tags: tags
      .filter((t) => t.content_id === x.id)
      .map((t) => termMap.get(t.term_id))
      .filter(Boolean),
  }));
});
export {contentPath} from "./content-routes.mjs";
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
  const { data, error } = await client
    .from("ig_public_content")
    .select("kind,slug,published_at")
    .limit(10000);
  if (error) throw new Error("Published index is temporarily unavailable.");
  return data;
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
    contexts: x.tags
      .filter((t) => t.dimension === "opportunity-context")
      .map((t) => t.slug),
    focus: [],
  };
}
