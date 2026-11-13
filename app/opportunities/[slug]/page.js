import { propertyEditorial } from "../../../lib/property-editorial.mjs";
import { pageMeta } from "../../../lib/seo.mjs";
import Seo from "../../seo";
import { published, cmsMetadata } from "../../../lib/cms";
import PropertyDetail from "../../property-detail";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { opportunities } from "../../../lib/content.mjs";
import { PageHero, Eyebrow, LinkButton, ContactBand } from "../../components";
export function generateStaticParams() {
  return opportunities.map((x) => ({ slug: x.slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const records = await published("opportunity");
  return records === null
    ? pageMeta("/opportunities/" + slug)
    : cmsMetadata(records.find((x) => x.slug === slug));
}
export default async function Opportunity({ params }) {
  const { slug } = await params;
  const records = await published("opportunity");
  if (records !== null) {
    const item = records.find((x) => x.slug === slug);
    if (!item) notFound();
    return (
      <PropertyDetail
        item={item}
        related={records
          .filter((x) => x.slug !== slug && x.public_data.image)
          .slice(0, 2)}
      />
    );
  }
  const fallback = opportunities.map((x) => ({
    slug: x.slug,
    title: x.title,
    summary: propertyEditorial[x.slug]?.summary || x.description,
    body: propertyEditorial[x.slug]?.body || x.description,
    kind: "opportunity",
    tags: [],
    public_data: {
      city: x.city,
      region: x.region,
      sector: x.sector,
      image: x.image,
      image_alt: x.title,
      asset_class: x.type,
      reference: "Portfolio reference",
    },
  }));
  const item = fallback.find((x) => x.slug === slug);
  if (!item) notFound();
  return (
    <PropertyDetail
      item={item}
      related={fallback
        .filter((x) => x.slug !== slug && x.public_data.image)
        .slice(0, 2)}
    />
  );
}
