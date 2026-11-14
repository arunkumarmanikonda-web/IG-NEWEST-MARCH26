import { siteSection } from "../../lib/website";
import { pageMeta } from "../../lib/seo.mjs";
import Seo from "../seo";
import Link from "next/link";
import { livePractices } from "../../lib/website";
import { PageHero, Eyebrow, Arrow, ContactBand } from "../components";
export const metadata = pageMeta("/practices");
export default async function Practices() {
  const copy = await siteSection("practices");
  const practices = await livePractices();
  return (
    <main id="main">
      <Seo path="/practices" />
      <PageHero
        eyebrow={copy["eyebrow-our-practices"]}
        title={
          <>{copy["commercial-perspective"]}<br />
            <em>{copy["across-the-lifecycle"]}</em>
          </>
        }
        description={copy["description-a-connected-set-of-advisory-and-delivery"]}
      />
      <section className="section-pad">
        <div className="service-grid">
          {practices.map((p) => (
            <article className="service-item" key={p.slug}>
              <Eyebrow>
                {p.slug === "real-estate"
                  ? "REAL ESTATE LISTINGS & ADVISORY"
                  : "OUR EXPERTISE"}
              </Eyebrow>
              <h2>{p.title}</h2>
              <p>{p.intro}</p>
              {p.slug === "real-estate" && (
                <Link
                  href="/opportunities"
                  className="button practice-collection-cta"
                >{copy["browse-real-estate-listings"]} <Arrow />
                </Link>
              )}
              <Link href={p.href || "/practices/" + p.slug} className="text-link">{copy["explore-the-practice"]} <Arrow />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <ContactBand />
    </main>
  );
}
