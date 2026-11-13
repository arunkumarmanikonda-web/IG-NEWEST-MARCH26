import PracticeExplorer from "./practice-explorer";
import Image from "next/image";
import PropertyCard from "./property-card";
import { collectionItems } from "../lib/property-collection.mjs";
import Link from "next/link";
import { pageMeta } from "../lib/seo.mjs";
import { practices, insights, opportunities } from "../lib/content.mjs";
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
      <section className="editorial-hero home-editorial">
        <Image
          src="/images/city.jpg"
          alt="Commercial architecture in Gurugram"
          fill
          sizes="100vw"
          preload
        />
        <div className="editorial-shade" />
        <div className="editorial-hero-copy">
          <Eyebrow>PROPERTY · ADVISORY · TRANSACTIONS</Eyebrow>
          <h1>
            Distinctive properties.
            <br />
            Considered decisions.
            <br />
            <em>Connected expertise.</em>
          </h1>
          <p>
            Discover real estate and hospitality assets across India.
            <br />
            Find the right property. Shape the next chapter.
          </p>
          <div className="hero-actions">
            <LinkButton href="/opportunities" light>
              Explore the Property Collection
            </LinkButton>
            <Link href="/practices" className="hero-secondary">
              Our practices <Arrow />
            </Link>
          </div>
        </div>
        <div className="hero-side-note">
          <span>EST. 2017</span>
          <p>
            Indian roots.
            <br />A national perspective.
          </p>
        </div>
        <div className="editorial-hero-foot">
          <span>CELEBRATING DESINESS</span>
          <a href="#real-estate-listings">Discover the collection ↓</a>
        </div>
      </section>
      <div className="home-discovery">
        <form action="/search" role="search">
          <label htmlFor="home-search">
            Find a practice, property or product
          </label>
          <div>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="Location, asset type, service or SKU"
              maxLength={200}
            />
            <button type="submit">
              Search <Arrow />
            </button>
          </div>
        </form>
        <nav aria-label="Explore India Gully">
          <a href="#core-practices">Our practices ↓</a>
          <a href="#real-estate-listings">Property Collection ↓</a>
          <Link href="/horeca">HORECA catalogue ↗</Link>
        </nav>
      </div>
      <section
        className="section-pad home-property-collection"
        id="real-estate-listings"
      >
        <div className="section-heading">
          <div>
            <Eyebrow>REAL ESTATE IS AT OUR CORE</Eyebrow>
            <h2>The Property Collection.</h2>
          </div>
          <div className="collection-heading-copy">
            <p>
              Places with possibility. Explore commercial properties,
              hospitality assets and development opportunities, with a team that
              understands the business behind them.
            </p>
            <Link className="text-link" href="/opportunities">
              Explore the full collection <Arrow />
            </Link>
          </div>
        </div>
        <div className="home-property-grid">
          {listings.map((x, i) => (
            <PropertyCard key={x.slug} item={x} featured={i === 0} />
          ))}
        </div>
        {!listings.length && (
          <div className="listing-enquiry">
            <h3>Your next property starts with a brief.</h3>
            <p>
              Tell us your location, asset class and transaction objectives. Our
              team will confirm suitable properties and their current
              availability.
            </p>
            <Link
              className="button"
              href="/contact?interest=Real%20Estate%20Listings%20%26%20Advisory"
            >
              Share your requirement <Arrow />
            </Link>
          </div>
        )}
        <div className="collection-closing">
          <p>
            Portfolio references are clearly identified. Current availability
            and mandate status are confirmed by our team.
          </p>
          <Link
            className="text-link"
            href="/contact?interest=List%20a%20property"
          >
            Bring your property to market <Arrow />
          </Link>
        </div>
      </section>
      <TrustStrip />
      <section className="practice-section section-pad" id="core-practices">
        <div className="section-heading">
          <div>
            <Eyebrow>THE PRACTICES</Eyebrow>
            <h2>
              Specialist depth.
              <br />A shared commercial view.
            </h2>
          </div>
          <p>
            Choose the discipline that fits your brief. We bring the connected
            expertise that the assignment requires.
          </p>
        </div>
        <PracticeExplorer />
      </section>

      <section className="story-grid section-pad" id="the-practice">
        <div>
          <Eyebrow>OUR PERSPECTIVE</Eyebrow>
          <h2>
            Assets, capital and
            <br />
            operations are connected.
            <br />
            <em>So are we.</em>
          </h2>
        </div>
        <div className="editorial-body">
          <p className="large-copy">
            A property decision is also a business decision. A transaction has
            to work beyond the signing table.
          </p>
          <p>
            India Gully brings together real estate advisory, transaction
            preparation, debt and special situations, hospitality projects and
            HORECA procurement. We work with owners, promoters, investors and
            operators to connect the commercial case with a practical delivery
            plan.
          </p>
          <Link className="text-link" href="/about">
            Our story and approach <Arrow />
          </Link>
        </div>
      </section>
      <section className="feature-split">
        <div className="feature-image">
          <Image
            src="/images/dining.jpg"
            alt="Hospitality dining experience"
            fill
            sizes="(max-width:760px) 100vw, 50vw"
          />
        </div>
        <div className="feature-copy">
          <Eyebrow>HOSPITALITY / DESIGN COORDINATION / PMC</Eyebrow>
          <h2>
            A distinctive experience.
            <br />
            <em>A sound business behind it.</em>
          </h2>
          <p>
            From feasibility and operator selection to design coordination,
            project management and opening readiness. Keep the owner’s
            objectives and the guest experience in the same conversation.
          </p>
          <div className="inline-tags">
            <span>Feasibility</span>
            <span>Operator strategy</span>
            <span>Design coordination</span>
            <span>PMC</span>
          </div>
          <LinkButton href="/projects" light>
            Explore project delivery
          </LinkButton>
        </div>
      </section>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>SELECTED WORK</Eyebrow>
            <h2>Experience in context.</h2>
          </div>
          <Link className="text-link" href="/our-work">
            Explore our work <Arrow />
          </Link>
        </div>
        <WorkGrid
          items={work.filter((x) =>
            ["entertainment-city", "khubani-andaz", "fern-residency"].includes(
              x.slug,
            ),
          )}
        />
      </section>
      <div className="two-paths">
        <article>
          <Eyebrow>HORECA PROCUREMENT</Eyebrow>
          <h2>
            Every detail contributes
            <br />
            to the experience.
          </h2>
          <p>
            Tableware, linen, equipment, housekeeping and operating supplies.
            Build a sourcing brief around your specifications, budget and
            delivery programme.
          </p>
          <Link className="text-link" href="/horeca">
            Explore procurement <Arrow />
          </Link>
        </article>
        <article>
          <Eyebrow>COMPLIMENTARY VALUATION STUDIO</Eyebrow>
          <h2>
            Understand the assumptions
            <br />
            behind the number.
          </h2>
          <p>
            Explore property income capitalisation, discounted cash flow and
            hotel enterprise value. Adjust the inputs and compare indicative
            scenarios.
          </p>
          <Link className="text-link" href="/valuation">
            Open valuation tools <Arrow />
          </Link>
        </article>
      </div>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>THE PEOPLE BEHIND THE PRACTICE</Eyebrow>
            <h2>
              Senior experience.
              <br />
              Direct involvement.
            </h2>
          </div>
          <Link className="text-link" href="/leadership">
            Meet our leadership <Arrow />
          </Link>
        </div>
        <LeadershipCards people={people} />
      </section>
      <ConfidentialityBand />
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>PERSPECTIVES</Eyebrow>
            <h2>
              Questions that shape
              <br />
              better decisions.
            </h2>
          </div>
          <Link className="text-link" href="/insights">
            Read all perspectives <Arrow />
          </Link>
        </div>
        <InsightCards items={posts} />
      </section>
      <ContactBand
        title="What are you planning next?"
        text="An asset, a transaction, a hospitality project or a procurement brief. Let’s start with your commercial priorities."
      />
    </main>
  );
}
