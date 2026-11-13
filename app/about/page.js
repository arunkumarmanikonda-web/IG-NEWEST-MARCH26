import Image from "next/image";
import Link from "next/link";
import { pageMeta } from "../../lib/seo.mjs";
import { companyContent } from "../../lib/editorial";
import { milestones, principles } from "../../lib/company.mjs";
import { Eyebrow, ContactBand, Arrow } from "../components";
import {
  TrustStrip,
  TextBody,
  LeadershipCards,
  ConfidentialityBand,
} from "../editorial-components";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/about");
export default async function About() {
  const { people, pages } = await companyContent();
  const story = pages.get("company-story");
  return (
    <main id="main">
      <section className="editorial-hero">
        <Image
          src="/images/city.jpg"
          alt="India’s evolving commercial landscape"
          fill
          sizes="100vw"
          preload
        />
        <div className="editorial-shade" />
        <div className="editorial-hero-copy">
          <Eyebrow>OUR STORY / ESTABLISHED 2017</Eyebrow>
          <h1>
            Rooted in India.
            <br />
            <em>Built around possibility.</em>
          </h1>
          <p>
            Advisory, transactions and delivery.
            <br />
            Connected by people who understand the business.
          </p>
          <a href="#our-story" className="text-link">
            Discover India Gully <Arrow />
          </a>
        </div>
        <span className="hero-caption">CELEBRATING DESINESS</span>
      </section>
      <TrustStrip />
      {story && (
        <section className="story-grid section-pad" id="our-story">
          <div>
            <Eyebrow>WHO WE ARE</Eyebrow>
            <h2>{story.title}</h2>
          </div>
          <TextBody text={story.body} />
        </section>
      )}
      <section className="vision-section section-pad">
        {["company-vision", "company-mission"].map((slug) => {
          const p = pages.get(slug);
          return (
            p && (
              <article key={slug}>
                <Eyebrow>{p.title}</Eyebrow>
                <h2>{p.summary}</h2>
                <p>{p.body}</p>
              </article>
            )
          );
        })}
      </section>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>HOW WE WORK</Eyebrow>
            <h2>
              Principles that guide
              <br />
              the engagement.
            </h2>
          </div>
          <p>
            Professional standards matter in the everyday decisions: what we
            disclose, how we assess a brief and who remains accountable.
          </p>
        </div>
        <div className="principle-grid">
          {principles.map(([title, text], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="history-section section-pad journey-section" id="our-journey" aria-labelledby="journey-title">
        <div className="journey-intro">
          <Eyebrow>THE INDIA GULLY JOURNEY</Eyebrow>
          <h2 id="journey-title">Built through experience.<br /><em>Expanded with purpose.</em></h2>
          <p>Each chapter has added a new perspective. Together, they have shaped a practice that connects commercial insight with the detail of execution.</p>
          <span className="journey-years">2017 <span aria-hidden="true">→</span> TODAY</span>
          <Link className="text-link" href="/practices">Explore our practices <Arrow /></Link>
        </div>
        <ol className="timeline journey-timeline">
          {milestones.map(([year, title, text, discipline]) => (
            <li key={year} className={year === "Today" ? "journey-present" : undefined}>
              <span className="journey-year">{year}</span>
              <div className="journey-chapter">
                <span className="journey-discipline">{discipline}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>OUR LEADERSHIP</Eyebrow>
            <h2>
              Experience with
              <br />
              personal accountability.
            </h2>
          </div>
          <Link className="text-link" href="/leadership">
            Meet the team <Arrow />
          </Link>
        </div>
        <LeadershipCards people={people} />
      </section>
      <ConfidentialityBand />
      <section className="company-identity section-pad">
        <Eyebrow>THE COMPANY BEHIND THE BRAND</Eyebrow>
        <h2>
          Vivacious Entertainment and
          <br />
          Hospitality Private Limited
        </h2>
        <dl>
          <div>
            <dt>Established</dt>
            <dd>2017 · New Delhi, India</dd>
          </div>
          <div>
            <dt>Corporate identity number</dt>
            <dd>U74999DL2017PTC323237</dd>
          </div>
          <div>
            <dt>GST registration</dt>
            <dd>07AAGCV0867P1ZN</dd>
          </div>
        </dl>
      </section>
      <ContactBand title="A commercial question deserves a considered conversation." />
    </main>
  );
}
