import { siteConfig, pages } from "../lib/seo.mjs";
import { publishedIndex, contentPath } from "../lib/cms";
import { siteSection } from "../lib/website";
import { publicResidences } from "../lib/residences.mjs";
import { readPublicCareers } from "../lib/careers-data.js";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const { origin, indexable } = siteConfig();
  if (!indexable) return [];
  const [records, launchConfig, careers] = await Promise.all([publishedIndex(), siteSection("residences-launch"), readPublicCareers().catch(() => null)]);
  const residences = publicResidences(launchConfig);
  const baseline =
    records === null
      ? pages
      : pages.filter((p) => !/^\/(opportunities|insights)\//.test(p.path));
  const entries = [
    {url:new URL("/retail-leasing",origin).href},
    {url:new URL("/careers",origin).href},
    ...(careers?.settings.enabled ? careers.jobs.map(job => ({url:new URL(`/careers/${job.slug}`,origin).href,...(job.updated_at ? {lastModified:job.updated_at} : {})})) : []),
    ...(residences ? [{url:new URL(residences.href,origin).href}] : []),
    ...baseline.map((p) => ({ url: new URL(p.path, origin).href })),
    ...(records || []).map((x) => ({
      url: new URL(contentPath(x), origin).href,
      lastModified: x.published_at,
    })),
  ];
  return [...new Map(entries.map((x) => [x.url, x])).values()];
}
