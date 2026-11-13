import PracticeExplorer from "./practice-explorer";
import Image from "next/image";
import BrandLogo from "./brand-logo";
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
  const listings = (
    assets === null ? opportunities : assets.map(opportunityCard)
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
          <Eyebrow>ADVISORY · TRANSACTIONS · DELIVERY</Eyebrow>
          <h1>
            Perspective that sees
            <br />
            the whole opportunity.
            <br />
            <em>Expertise that moves it.</em>
          </h1>
          <p>
            Real estate. Capital. Hospitality.
            <br />
            From the commercial question to the work of execution.
          </p>
          <div className="hero-actions">
            <LinkButton href="/practices" light>
              Explore our practices
            </LinkButton>
            <Link href="/opportunities" className="hero-secondary">
              View opportunities <Arrow />
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
          <a href="#the-practice">Discover the practice ↓</a>
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
          <a href="#real-estate-listings">Real estate listings ↓</a>
          <Link href="/horeca">HORECA catalogue ↗</Link>
        </nav>
      </div>
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
      <section
        className="section-pad featured-opportunities"
        id="real-estate-listings"
      >
        <div className="section-heading">
          <div>
            <Eyebrow>REAL ESTATE & HOSPITALITY</Eyebrow>
            <h2>
              Real estate listings.
              <br />A considered starting point.
            </h2>
          </div>
          <Link className="text-link" href="/opportunities">
            Search all listings <Arrow />
          </Link>
        </div>
        <div className="featured-listings">
          {listings.map((x) => (
            <Link href={"/opportunities/" + x.slug} key={x.slug}>
              <div
                className={
                  "listing-image " + (!x.image ? "listing-placeholder" : "")
                }
              >
                {x.image ? (
                  <Image
                    src={x.image}
                    unoptimized={x.image.startsWith("/images/generated/")}
                    alt={x.title}
                    fill
                    sizes="(max-width:760px) 90vw, 30vw"
                  />
                ) : (
                  <>
                    <BrandLogo light className="placeholder-logo" />
                    <strong>
                      Portfolio
                      <br />
                      reference.
                    </strong>
                  </>
                )}
                <span className="listing-sector">{x.sector}</span>
                {x.image?.startsWith("/images/generated/") && (
                  <span className="generated-badge">
                    Illustrative AI-generated concept
                  </span>
                )}
              </div>
              <div className="card-meta">{x.location}</div>
              <h3>{x.title}</h3>
              <p>{x.description}</p>
              <span className="read-link">
                View public brief <Arrow />
              </span>
            </Link>
          ))}
        </div>
        {!listings.length && (
          <div className="listing-enquiry">
            <h3>Tell us what you are looking for.</h3>
            <p>
              Explore acquisitions, development partnerships, hospitality
              investments and commercial leasing with a focused brief. Our team
              will confirm which opportunities fit your objectives and are
              available for discussion.
            </p>
            <Link
              className="button"
              href="/contact?interest=Real%20Estate%20Advisory"
            >
              Share an investment brief <Arrow />
            </Link>
            <Link className="text-link" href="/our-work">
              Explore our selected work <Arrow />
            </Link>
          </div>
        )}
        <p className="fine-note">
          Availability and mandate status are confirmed on enquiry. Public
          briefs contain only information approved for disclosure.
        </p>
        <div className="opportunity-types">
          <span>Acquisitions & divestments</span>
          <span>Strategic investment</span>
          <span>Joint ventures & development</span>
          <span>CIRP & special situations</span>
          <span>Leasing</span>
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
