import AdvertisingEvent from "../advertising-event";
import { siteSection } from "../../lib/website";
import Link from "next/link";
import { pageMeta } from "../../lib/seo.mjs";
import Seo from "../seo";
import { opportunities } from "../../lib/content.mjs";
import { Arrow, Eyebrow, ContactBand } from "../components";
import Explorer from "./explorer";
import { published, opportunityCard } from "../../lib/cms";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/opportunities");
export default async function Opportunities({ searchParams }) {
  const copy = await siteSection("opportunities");
  const [records, params] = await Promise.all([
    published("opportunity"),
    searchParams,
  ]);
  const items = records === null ? opportunities : records.map(opportunityCard);
  const contexts =
    records === null
      ? undefined
      : [
          ...new Map(
            records.flatMap((x) =>
              x.tags
                .filter((t) => t.dimension === "opportunity-context")
                .map((t) => [t.slug, { id: t.slug, label: t.label }]),
            ),
          ).values(),
        ];
  const filters = Object.fromEntries(
    ["q", "sector", "city", "type", "context", "sort", "view"].map((k) => [
      k,
      typeof params?.[k] === "string" ? params[k].slice(0, 200) : "",
    ]),
  );
  return (
    <main id="main" className="collection-page">
      <Seo path="/opportunities" /><AdvertisingEvent practice="real-estate"/>
      <header className="collection-masthead">
        <div>
          <Eyebrow>{copy["real-estate-india-gully"]}</Eyebrow>
          <h1>{copy["real-estate-listings"]}</h1>
          <p>{copy["commercial-property-hospitality-assets-and-development-opportunities"]}</p>
        </div>
        <Link className="button" href="/contact?interest=List%20a%20property">{copy["list-your-property"]} <Arrow />
        </Link>
      </header>
      <section className="collection-browser" aria-label="Browse properties">
        <Explorer items={items} contexts={contexts} initialFilters={filters} />
        <p className="fine-note">{copy["portfolio-references-are-not-current-offers-availability"]}</p>
      </section>
      <section className="collection-service-band">
        <Eyebrow>{copy["real-estate-advisory"]}</Eyebrow>
        <h2>{copy["from-property-search"]}<br />{copy["to-transaction"]}</h2>
        <div>
          <p>{copy["whether-you-are-acquiring-an-asset-seeking"]}</p>
          <Link className="text-link" href="/practices/real-estate">{copy["real-estate-listings-advisory"]} <Arrow />
          </Link>
        </div>
      </section>
      <ContactBand
        title={copy["title-a-specific-property-in-mind"]}
        text={copy["text-share-your-preferred-location-asset-class-transaction"]}
        interest="Real Estate Listings & Advisory"
      />
    </main>
  );
}
