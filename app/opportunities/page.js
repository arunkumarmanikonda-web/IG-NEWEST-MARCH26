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
      <Seo path="/opportunities" />
      <header className="collection-masthead">
        <div>
          <Eyebrow>REAL ESTATE · INDIA GULLY</Eyebrow>
          <h1>Real Estate Listings</h1>
          <p>Commercial property, hospitality assets and development opportunities.</p>
        </div>
        <Link className="button" href="/contact?interest=List%20a%20property">
          List your property <Arrow />
        </Link>
      </header>
      <section className="collection-browser" aria-label="Browse properties">
        <Explorer items={items} contexts={contexts} initialFilters={filters} />
        <p className="fine-note">
          Portfolio references are not current offers. Availability, ownership
          particulars, commercial terms and mandate status require confirmation.
          Special-situation classifications appear only where supported by
          approved information.
        </p>
      </section>
      <section className="collection-service-band">
        <Eyebrow>REAL ESTATE ADVISORY</Eyebrow>
        <h2>
          From property search<br />to transaction.
        </h2>
        <div>
          <p>
            Whether you are acquiring an asset, seeking a development partner,
            leasing a space or considering a sale, we connect your property
            brief with the commercial advice it needs.
          </p>
          <Link className="text-link" href="/practices/real-estate">
            Real Estate Listings & Advisory <Arrow />
          </Link>
        </div>
      </section>
      <ContactBand
        title="A specific property in mind?"
        text="Share your preferred location, asset class, transaction objective and investment parameters."
        interest="Real Estate Listings & Advisory"
      />
    </main>
  );
}
