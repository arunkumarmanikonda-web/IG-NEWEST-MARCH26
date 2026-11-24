"use client";
import ShortlistButton from "./shortlist/button";
import { useFeatureImpression } from "./opportunities/featured-banner";
import {propertyPhotoURL} from '../lib/listing-images.mjs';
import {listingHeading} from "../lib/listing-heading.mjs";
import Image from "next/image";
import PropertyTags from "./property-tags";
import Link from "next/link";
import { Arrow } from "./components";
import BrandLogo from "./brand-logo";
import { propertyFacts, propertyStatus } from "../lib/property-collection.mjs";
import { listingLifecycle } from "../lib/listing-lifecycle.mjs";
import ListingStatus from "./listing-status";

export default function PropertyCard({ item: x }) {
  const property = !x.kind || x.kind === "opportunity";
  const lifecycle = listingLifecycle(x);
  const featureId = property && !lifecycle.isAvailable ? null : x.feature?.id;
  const cardRef = useFeatureImpression(featureId);
  const href = (x.href || "/opportunities/" + x.slug) + (featureId ? "?feature=" + encodeURIComponent(featureId) : "");
  const facts = propertyFacts(x).filter(([key]) => ["Area", "Keys", "Tenure"].includes(key));
  return (
    <article className={"property-card" + (property && !lifecycle.isAvailable ? " property-card-unavailable" : "")} ref={cardRef}>
      <Link className="property-card-image" href={href} aria-label={"View " + x.title}>
        {x.image ? <Image src={propertyPhotoURL(x.image)} unoptimized={/^\/images\/(generated|library)\//.test(x.image)} alt={x.imageAlt || x.title} fill sizes="(max-width:640px) 90vw, (max-width:1000px) 44vw, 29vw" /> : (
          <div className="property-no-photo"><BrandLogo light /><span>Photography on request</span></div>
        )}
        <span className="property-image-label">{x.listingLabel || (featureId ? "Featured opportunity" : x.sector)}</span>
        {property && <ListingStatus item={x} className="property-card-status" />}
        {x.image?.startsWith("/images/generated/") && <span className="generated-badge">Illustrative AI-generated concept</span>}
      </Link>
      <div className="property-card-copy">
        <div className="property-kicker"><span>{x.location}</span>{!property && <span>{propertyStatus(x)}</span>}</div>
        <h3><Link href={href}>{listingHeading(x.title)}</Link></h3>
        <p className="property-card-type">{x.assetClass || x.type}</p>
        <PropertyTags tags={x.tags} contexts={x.contexts} />
        {x.description && <p className="property-card-description">{x.description}</p>}
        {!!facts.length && <dl className="property-card-facts">{facts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
        <ShortlistButton id={x.id} allowAdd={!property || lifecycle.isAvailable}/>
        <div className="property-card-foot">
          <div><span>{property && lifecycle.isHistorical ? "Retained for reference" : x.priceCaption || (x.price ? "Indicative price" : "Commercial details")}</span><strong>{property && !lifecycle.isAvailable ? propertyStatus(x) : x.price || "On request"}</strong></div>
          <Link href={href} aria-label={"View details for " + x.title}>{property && lifecycle.isHistorical ? "View property record" : "View details"} <Arrow /></Link>
        </div>
      </div>
    </article>
  );
}
