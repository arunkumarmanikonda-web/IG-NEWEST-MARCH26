import Image from "next/image";
import Link from "next/link";
import { Arrow } from "./components";
import BrandLogo from "./brand-logo";
import { propertyFacts, propertyStatus } from "../lib/property-collection.mjs";

export default function PropertyCard({ item, featured = false }) {
  const x = item;
  const href = "/opportunities/" + x.slug;
  return (
    <article
      className={"property-card" + (featured ? " property-card-featured" : "")}
    >
      <Link
        className="property-card-image"
        href={href}
        aria-label={"Explore " + x.title}
      >
        {x.image ? (
          <Image
            src={x.image}
            unoptimized={x.image.startsWith("/images/generated/")}
            alt={x.imageAlt || x.title}
            fill
            sizes={
              featured
                ? "(max-width:760px) 90vw, 58vw"
                : "(max-width:760px) 90vw, 44vw"
            }
          />
        ) : (
          <div className="property-no-photo">
            <BrandLogo light />
            <span>Photography available on enquiry</span>
          </div>
        )}
        <span className="property-image-label">{x.sector}</span>
        {x.image?.startsWith("/images/generated/") && (
          <span className="generated-badge">
            Illustrative AI-generated concept
          </span>
        )}
        <span className="property-image-action" aria-hidden="true">
          <Arrow />
        </span>
      </Link>
      <div className="property-card-copy">
        <div className="property-kicker">
          <span>{x.location}</span>
          <span>{propertyStatus(x)}</span>
        </div>
        <h3>
          <Link href={href}>{x.title}</Link>
        </h3>
        <p className="property-card-type">{x.assetClass || x.type}</p>
        {featured && (
          <p className="property-card-description">{x.description}</p>
        )}
        {!!(x.area || x.keys || x.tenure) && (
          <div className="property-card-facts">
            {propertyFacts(x)
              .filter(([k]) => ["Area", "Keys", "Tenure"].includes(k))
              .map(([k, v]) => (
                <span key={k}>
                  <strong>{v}</strong> {k === "Area" ? "" : k.toLowerCase()}
                </span>
              ))}
          </div>
        )}
        <div className="property-card-foot">
          <span>{x.price || "Details on enquiry"}</span>
          <Link href={href}>
            Explore property <Arrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
