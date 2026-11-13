import Image from "next/image";
import Link from "next/link";
import { Arrow } from "./components";
import BrandLogo from "./brand-logo";
import { propertyFacts, propertyStatus } from "../lib/property-collection.mjs";

export default function PropertyCard({ item: x }) {
  const href = "/opportunities/" + x.slug;
  const facts = propertyFacts(x).filter(([key]) => ["Area", "Keys", "Tenure"].includes(key));
  return (
    <article className="property-card">
      <Link className="property-card-image" href={href} aria-label={"View " + x.title}>
        {x.image ? <Image src={x.image} unoptimized={x.image.startsWith("/images/generated/")} alt={x.imageAlt || x.title} fill sizes="(max-width:640px) 90vw, (max-width:1000px) 44vw, 29vw" /> : (
          <div className="property-no-photo"><BrandLogo light /><span>Photography on request</span></div>
        )}
        <span className="property-image-label">{x.sector}</span>
        {x.image?.startsWith("/images/generated/") && <span className="generated-badge">Illustrative AI-generated concept</span>}
      </Link>
      <div className="property-card-copy">
        <div className="property-kicker"><span>{x.location}</span><span>{propertyStatus(x)}</span></div>
        <h3><Link href={href}>{x.title}</Link></h3>
        <p className="property-card-type">{x.assetClass || x.type}</p>
        {x.description && <p className="property-card-description">{x.description}</p>}
        {!!facts.length && <dl className="property-card-facts">{facts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}
        <div className="property-card-foot">
          <div><span>{x.price ? "Indicative price" : "Commercial details"}</span><strong>{x.price || "On request"}</strong></div>
          <Link href={href} aria-label={"View details for " + x.title}>View details <Arrow /></Link>
        </div>
      </div>
    </article>
  );
}
