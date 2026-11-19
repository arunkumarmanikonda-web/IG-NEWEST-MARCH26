import Link from "next/link";
import {notFound} from "next/navigation";
import {siteSection} from "../../lib/website";
import {publicResidences} from "../../lib/residences.mjs";
import {siteConfig} from "../../lib/seo.mjs";
import ResidencesLaunch from "./launch";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const launch = publicResidences(await siteSection("residences-launch"));
  if (!launch) return {title:"Residences",robots:{index:false,follow:false}};
  const {origin,indexable} = siteConfig();
  return {title:launch.name,description:launch.description.slice(0,160),alternates:{canonical:origin+launch.href},robots:{index:indexable,follow:indexable},openGraph:{title:launch.headline,description:launch.description.slice(0,160),url:origin+launch.href,...(launch.image ? {images:[{url:new URL(launch.image,origin).href,alt:launch.imageAlt}]} : {})}};
}
export default async function ResidencesPage() {
  const launch = publicResidences(await siteSection("residences-launch"));
  if (!launch) notFound();
  return <main id="main"><nav className="residences-breadcrumb" aria-label="Breadcrumb"><Link href="/">India Gully</Link><span aria-hidden="true">/</span><span aria-current="page">Residences</span></nav><ResidencesLaunch config={launch} detail /></main>;
}
