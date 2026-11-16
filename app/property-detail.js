import { listingHeading } from "../lib/listing-heading.mjs";
import PropertyTags from "./property-tags";
import Link from "next/link";
import { opportunityCard } from "../lib/cms";
import { propertyFacts, propertyStatus } from "../lib/property-collection.mjs";
import { narrativeParagraphs } from "../lib/teaser.mjs";
import PropertyPhotograph from "./property-photograph";
import PropertyCard from "./property-card";
import { Arrow, Eyebrow } from "./components";

export default function PropertyDetail({ item, hasRoom = false, related = [] }) {
  const x = opportunityCard(item),
    d = item.public_data;
  const contact = "/contact?interest=" + encodeURIComponent(item.title);
  const roomLink = "/account/nda?opportunity=" + encodeURIComponent(item.slug);
  return (
    <main id="main" className="property-detail-page">
      <nav className="property-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/opportunities">Real Estate Listings</Link>
        <span>/ {x.location}</span>
      </nav>
      <header className="property-title">
        <div>
          <Eyebrow>
            {x.location} · {x.sector}
          </Eyebrow>
          <h1>{listingHeading(x.title)}</h1>
          <p>{x.assetClass || x.type}</p>
          <PropertyTags tags={x.tags} contexts={x.contexts} />
        </div>
        <div className="property-title-terms">
          <span>{propertyStatus(x)}</span>
          <strong>{x.price || "Details on enquiry"}</strong>
          <Link className="text-link" href={contact}>
            Enquire about this property <Arrow />
          </Link>
        </div>
      </header>
      <section className="property-overview" aria-label="Property at a glance">
        <PropertyPhotograph image={x.image} alt={d.image_alt} title={x.title} />
        <div className="property-overview-panel">
          <Eyebrow>PROPERTY AT A GLANCE</Eyebrow>
          <h2>{listingHeading(x.assetClass || x.type)}</h2>
          <dl>
            <div><dt>Location</dt><dd>{x.location}</dd></div>
            <div><dt>Status</dt><dd>{propertyStatus(x)}</dd></div>
            {propertyFacts(x).filter(([key]) => key !== "Property type").map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>
          <Link className="button" href={hasRoom ? roomLink : contact}>{hasRoom ? "Request Data Room Access" : "Request Property Details"} <Arrow /></Link>
          <Link className="text-link" href={"/opportunities/" + item.slug + "/brief.pdf"} prefetch={false} target="_blank">Download property brief <Arrow /></Link>
        </div>
      </section>
      <div className="property-detail-layout">
        <article className="property-narrative">
          <Eyebrow>PROPERTY INFORMATION</Eyebrow>
          <h2>Overview</h2>
          <p className="property-summary">{item.summary}</p>
          {narrativeParagraphs(item.body,item.summary)
            .map((text, i) =>
              text.startsWith("## ") ? (
                <h3 key={i}>{listingHeading(text.slice(3))}</h3>
              ) : (
                <p key={i}>
                  {text}
                </p>
              ),
            )}
          {!d.confidential &&
            d.location_reviewed === true &&
            d.latitude &&
            d.longitude && (
              <p>
                <a
                  className="text-link"
                  href={
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(d.latitude + "," + d.longitude)
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  View approved location <Arrow />
                </a>
              </p>
            )}
          {x.image?.startsWith("/images/generated/") && (
            <p className="fine-note">
              The image is an illustrative AI-generated concept, not a
              photograph of this property.
            </p>
          )}
        </article>
        <aside className="property-adviser">
          <Eyebrow>INDIA GULLY · REAL ESTATE</Eyebrow>
          <h2>Property Documents</h2>
          <Link
            className="text-link"
            target="_blank"
            prefetch={false}
            href={"/opportunities/" + item.slug + "/brief.pdf"}
          >
            Download property brief <Arrow />
          </Link>
          {hasRoom && <>
            <Link className="button" href={roomLink}>Request Data Room Access <Arrow /></Link>
            <p className="fine-note">Register or sign in to request confidential documents for this property.</p>
          </>}
        </aside>
      </div>
      {!!related.length && (
        <section className="section-pad property-related">
          <div className="section-heading">
            <div>
              <Eyebrow>FURTHER OPPORTUNITIES</Eyebrow>
              <h2>Other Properties</h2>
            </div>
            <Link className="text-link" href="/opportunities">
              View all properties <Arrow />
            </Link>
          </div>
          <div className="property-grid">
            {related.map((record) => (
              <PropertyCard key={record.slug} item={opportunityCard(record)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
