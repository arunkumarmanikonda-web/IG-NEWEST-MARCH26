import { siteSection } from "../../../lib/website";
import { pageMeta } from "../../../lib/seo.mjs";
import { cmsMetadata } from "../../../lib/cms";
import Seo from "../../seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { livePractices } from "../../../lib/website";
import { practices } from "../../../lib/content.mjs";
import { PageHero, Eyebrow, ContactBand, LinkButton } from "../../components";
export function generateStaticParams() {
  return practices.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = (await livePractices()).find(item => item.slug === slug);
  if (p?.record) return cmsMetadata(p.record);
  const meta = pageMeta("/practices/" + slug);
  return p ? { ...meta, title: p.title, description: p.intro } : meta;
}
export default async function Practice({ params }) {
  const copy = await siteSection("practice-detail");
  const { slug } = await params;
  const p = (await livePractices()).find((p) => p.slug === slug);
  if (!p) notFound();
  return (
    <main id="main">
      <Seo path={"/practices/" + slug} />
      <PageHero
        eyebrow={p.title}
        title={p.line}
        description={p.intro}
        image={p.image}
      >
        {p.slug === "real-estate" && (
          <LinkButton href="/opportunities">{copy["browse-real-estate-listings"]}</LinkButton>
        )}
        <LinkButton href={"/contact?interest=" + encodeURIComponent(p.title)}>{copy["discuss-your-requirement"]}</LinkButton>
      </PageHero>
      <section className="section-pad">
        <div className="breadcrumb">
          <Link href="/">{copy["home"]}</Link>
          <span>/</span>
          <Link href="/practices">{copy["our-practices"]}</Link>
          <span>/ {p.title}</span>
        </div>
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["how-we-can-help"]}</Eyebrow>
            <h2>{copy["from-the-question"]}<br />{copy["to-the-next-decision"]}</h2>
          </div>
          <p>{p.audience}</p>
        </div>
        {p.body && <div className="prose-section">{p.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>}
        <div className="service-grid">
          {p.services.map(([title, text], i) => (
            <article className="service-item" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="scope-section">
        <div>
          <Eyebrow>{copy["a-clear-scope"]}</Eyebrow>
          <h2>{copy["work-with-a-defined-outcome"]}</h2>
          <p>{copy["every-engagement-begins-with-the-objective-available"]}</p>
        </div>
        <ul className="output-list">
          {p.outputs.map((text, i) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        {p.slug === "debt-special-situations" && (
          <p className="fine-note">{copy["india-gully-acts-as-an-adviser-and"]}</p>
        )}
        {p.slug === "transaction-advisory" && (
          <p className="fine-note">{copy["specialist-legal-tax-audit-and-technical-opinions"]}</p>
        )}
      </section>
      <ContactBand interest={p.title} />
    </main>
  );
}
