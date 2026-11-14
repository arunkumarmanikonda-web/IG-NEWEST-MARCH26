import { siteSection } from "../../lib/website";
import Image from "next/image";
import Link from "next/link";
import { pageMeta } from "../../lib/seo.mjs";
import { companyContent } from "../../lib/editorial";

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
  const copy = await siteSection("about");
  const [{ people, pages }, milestones, principles] = await Promise.all([companyContent(), siteSection("journey"), siteSection("principles")]);
  const story = pages.get("company-story");
  return (
    <main id="main">
      <section className="editorial-hero">
        <Image
          src={copy["src-images-city-jpg"]}
          alt={copy["alt-india-s-evolving-commercial-landscape"]}
          fill
          sizes="100vw"
          preload
        />
        <div className="editorial-shade" />
        <div className="editorial-hero-copy">
          <Eyebrow>{copy["our-story-established-2017"]}</Eyebrow>
          <h1>{copy["rooted-in-india"]}<br />
            <em>{copy["built-around-possibility"]}</em>
          </h1>
          <p>{copy["advisory-transactions-and-delivery"]}<br />{copy["connected-by-people-who-understand-the-business"]}</p>
          <a href="#our-story" className="text-link">{copy["discover-india-gully"]} <Arrow />
          </a>
        </div>
        <span className="hero-caption">{copy["celebrating-desiness"]}</span>
      </section>
      <TrustStrip />
      {story && (
        <section className="story-grid section-pad" id="our-story">
          <div>
            <Eyebrow>{copy["who-we-are"]}</Eyebrow>
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
            <Eyebrow>{copy["how-we-work"]}</Eyebrow>
            <h2>{copy["principles-that-guide"]}<br />{copy["the-engagement"]}</h2>
          </div>
          <p>{copy["professional-standards-matter-in-the-everyday-decisions"]}</p>
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
          <Eyebrow>{copy["the-india-gully-journey"]}</Eyebrow>
          <h2 id="journey-title">{copy["built-through-experience"]}<br /><em>{copy["expanded-with-purpose"]}</em></h2>
          <p>{copy["each-chapter-has-added-a-new-perspective"]}</p>
          <span className="journey-years">{copy["2017"]} <span aria-hidden="true">→</span> {copy["today"]}</span>
          <Link className="text-link" href="/practices">{copy["explore-our-practices"]} <Arrow /></Link>
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
            <Eyebrow>{copy["our-leadership"]}</Eyebrow>
            <h2>{copy["experience-with"]}<br />{copy["personal-accountability"]}</h2>
          </div>
          <Link className="text-link" href="/leadership">{copy["meet-the-team"]} <Arrow />
          </Link>
        </div>
        <LeadershipCards people={people} />
      </section>
      <ConfidentialityBand />
      <section className="company-identity section-pad">
        <Eyebrow>{copy["the-company-behind-the-brand"]}</Eyebrow>
        <h2>{copy["vivacious-entertainment-and"]}<br />{copy["hospitality-private-limited"]}</h2>
        <dl>
          <div>
            <dt>{copy["established"]}</dt>
            <dd>{copy["2017-new-delhi-india"]}</dd>
          </div>
          <div>
            <dt>{copy["corporate-identity-number"]}</dt>
            <dd>{copy["u74999dl2017ptc323237"]}</dd>
          </div>
          <div>
            <dt>{copy["gst-registration"]}</dt>
            <dd>{copy["07aagcv0867p1zn"]}</dd>
          </div>
        </dl>
      </section>
      <ContactBand title={copy["title-a-commercial-question-deserves-a-considered-conversation"]} />
    </main>
  );
}
