import { siteSection, renderSections } from "../lib/website";
import PracticeExplorer from "./practice-explorer";
import Image from "next/image";
import PropertyCard from "./property-card";
import { collectionItems } from "../lib/property-collection.mjs";
import Link from "next/link";
import { pageMeta } from "../lib/seo.mjs";
import { livePractices } from "../lib/website";
import { insights, opportunities } from "../lib/content.mjs";
import { published, opportunityCard } from "../lib/cms";
import { companyContent } from "../lib/editorial";
import {
  Arrow,
  LinkButton,
  Eyebrow,
  ContactBand,
  InsightCards,
} from "./components";
import {
  TrustStrip,
  LeadershipCards,
  ConfidentialityBand,
  WorkGrid,
} from "./editorial-components";
import Seo from "./seo";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/");
export default async function Home() {
  const [copy, layout] = await Promise.all([siteSection("home"), siteSection("home-layout")]);
  const [articles, assets, { people, work }] = await Promise.all([
    published("article"),
    published("opportunity"),
    companyContent(),
  ]);
  const posts =
    articles === null
      ? insights
      : articles.slice(0, 3).map((x) => ({
          ...x,
          image: x.public_data.image || "/images/city.jpg",
          category: x.public_data.sector || "INDIA GULLY PERSPECTIVES",
        }));
  const listings = collectionItems(
    assets === null ? opportunities : assets.map(opportunityCard),
  ).slice(0, 3);
  return (
    <main id="main">
      <Seo path="/" />
      {renderSections(layout, {
        "hero": (<section className="editorial-hero home-editorial">
        <Image
          src={copy["src-images-city-jpg"]}
          alt={copy["alt-commercial-architecture-in-gurugram"]}
          fill
          sizes="100vw"
          preload
        />
        <div className="editorial-shade" />
        <div className="editorial-hero-copy">
          <Eyebrow>{copy["property-advisory-transactions"]}</Eyebrow>
          <h1>{copy["distinctive-properties"]}<br />{copy["considered-decisions"]}<br />
            <em>{copy["connected-expertise"]}</em>
          </h1>
          <p>{copy["discover-real-estate-and-hospitality-assets-across"]}<br />{copy["find-the-right-property-shape-the-next"]}</p>
          <div className="hero-actions">
            <LinkButton href="/opportunities" light>{copy["browse-real-estate-listings"]}</LinkButton>
            <Link href="/practices" className="hero-secondary">{copy["our-practices"]} <Arrow />
            </Link>
          </div>
        </div>
        <div className="hero-side-note">
          <span>{copy["est-2017"]}</span>
          <p>{copy["indian-roots"]}<br />{copy["a-national-perspective"]}</p>
        </div>
        <div className="editorial-hero-foot">
          <span>{copy["celebrating-desiness"]}</span>
          <a href="#real-estate-listings">{copy["browse-real-estate-listings-1"]}</a>
        </div>
      </section>),

        "search": (<div className="home-discovery">
        <form action="/search" role="search">
          <label htmlFor="home-search">{copy["find-a-practice-property-or-product"]}</label>
          <div>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder={copy["placeholder-location-asset-type-service-or-sku"]}
              maxLength={200}
            />
            <button type="submit">{copy["search"]} <Arrow />
            </button>
          </div>
        </form>
        <nav aria-label="Explore India Gully">
          <a href="#core-practices">{copy["our-practices-2"]}</a>
          <a href="#real-estate-listings">{copy["real-estate-listings"]}</a>
          <Link href="/horeca">{copy["horeca-catalogue"]}</Link>
        </nav>
      </div>),

        "listings": (<section
        className="section-pad home-property-collection"
        id="real-estate-listings"
      >
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["real-estate-is-at-our-core"]}</Eyebrow>
            <h2>{copy["real-estate-listings-3"]}</h2>
          </div>
          <div className="collection-heading-copy">
            <p>{copy["explore-commercial-properties-hospitality-assets-and-development"]}</p>
            <Link className="text-link" href="/opportunities">{copy["view-all-properties"]} <Arrow />
            </Link>
          </div>
        </div>
        <div className="home-property-grid">
          {listings.map((x) => (
            <PropertyCard key={x.slug} item={x} />
          ))}
        </div>
        {!listings.length && (
          <div className="listing-enquiry">
            <h3>{copy["your-next-property-starts-with-a-brief"]}</h3>
            <p>{copy["tell-us-your-location-asset-class-and"]}</p>
            <Link
              className="button"
              href="/contact?interest=Real%20Estate%20Listings%20%26%20Advisory"
            >{copy["share-your-requirement"]} <Arrow />
            </Link>
          </div>
        )}
        <div className="collection-closing">
          <p>{copy["portfolio-references-are-clearly-identified-current-availability"]}</p>
          <Link
            className="text-link"
            href="/contact?interest=List%20a%20property"
          >{copy["bring-your-property-to-market"]} <Arrow />
          </Link>
        </div>
      </section>),

        "trust": (<TrustStrip />),

        "practices": (<section className="practice-section section-pad" id="core-practices">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["the-practices"]}</Eyebrow>
            <h2>{copy["specialist-depth"]}<br />{copy["a-shared-commercial-view"]}</h2>
          </div>
          <p>{copy["choose-the-discipline-that-fits-your-brief"]}</p>
        </div>
        <PracticeExplorer practices={await livePractices()} />
      </section>),


        "perspective": (<section className="story-grid section-pad" id="the-practice">
        <div>
          <Eyebrow>{copy["our-perspective"]}</Eyebrow>
          <h2>{copy["assets-capital-and"]}<br />{copy["operations-are-connected"]}<br />
            <em>{copy["so-are-we"]}</em>
          </h2>
        </div>
        <div className="editorial-body">
          <p className="large-copy">{copy["a-property-decision-is-also-a-business"]}</p>
          <p>{copy["india-gully-brings-together-real-estate-advisory"]}</p>
          <Link className="text-link" href="/about">{copy["our-story-and-approach"]} <Arrow />
          </Link>
        </div>
      </section>),

        "hospitality": (<section className="feature-split">
        <div className="feature-image">
          <Image
            src={copy["src-images-dining-jpg"]}
            alt={copy["alt-hospitality-dining-experience"]}
            fill
            sizes="(max-width:760px) 100vw, 50vw"
          />
        </div>
        <div className="feature-copy">
          <Eyebrow>{copy["hospitality-design-coordination-pmc"]}</Eyebrow>
          <h2>{copy["a-distinctive-experience"]}<br />
            <em>{copy["a-sound-business-behind-it"]}</em>
          </h2>
          <p>{copy["from-feasibility-and-operator-selection-to-design"]}</p>
          <div className="inline-tags">
            <span>{copy["feasibility"]}</span>
            <span>{copy["operator-strategy"]}</span>
            <span>{copy["design-coordination"]}</span>
            <span>{copy["pmc"]}</span>
          </div>
          <LinkButton href="/projects" light>{copy["explore-project-delivery"]}</LinkButton>
        </div>
      </section>),

        "work": (<section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["selected-work"]}</Eyebrow>
            <h2>{copy["experience-in-context"]}</h2>
          </div>
          <Link className="text-link" href="/our-work">{copy["explore-our-work"]} <Arrow />
          </Link>
        </div>
        <WorkGrid
          items={work.filter((x) =>
            ["entertainment-city", "khubani-andaz", "fern-residency"].includes(
              x.slug,
            ),
          )}
        />
      </section>),

        "services": (<div className="two-paths">
        <article>
          <Eyebrow>{copy["horeca-procurement"]}</Eyebrow>
          <h2>{copy["every-detail-contributes"]}<br />{copy["to-the-experience"]}</h2>
          <p>{copy["tableware-linen-equipment-housekeeping-and-operating-supplies"]}</p>
          <Link className="text-link" href="/horeca">{copy["explore-procurement"]} <Arrow />
          </Link>
        </article>
        <article>
          <Eyebrow>{copy["complimentary-valuation-studio"]}</Eyebrow>
          <h2>{copy["understand-the-assumptions"]}<br />{copy["behind-the-number"]}</h2>
          <p>{copy["explore-property-income-capitalisation-discounted-cash-flow"]}</p>
          <Link className="text-link" href="/valuation">{copy["open-valuation-tools"]} <Arrow />
          </Link>
        </article>
      </div>),

        "leadership": (<section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["the-people-behind-the-practice"]}</Eyebrow>
            <h2>{copy["senior-experience"]}<br />{copy["direct-involvement"]}</h2>
          </div>
          <Link className="text-link" href="/leadership">{copy["meet-our-leadership"]} <Arrow />
          </Link>
        </div>
        <LeadershipCards people={people} />
      </section>),

        "confidentiality": (<ConfidentialityBand />),

        "insights": (<section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["perspectives"]}</Eyebrow>
            <h2>{copy["questions-that-shape"]}<br />{copy["better-decisions"]}</h2>
          </div>
          <Link className="text-link" href="/insights">{copy["read-all-perspectives"]} <Arrow />
          </Link>
        </div>
        <InsightCards items={posts} />
      </section>),

        "contact": (<ContactBand
        title={copy["title-what-are-you-planning-next"]}
        text={copy["text-an-asset-a-transaction-a-hospitality-project"]}
      />),})}
    </main>
  );
}
