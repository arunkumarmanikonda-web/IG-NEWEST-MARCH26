import { pageMeta } from "../../../lib/seo.mjs";
import Seo from "../../seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { practices } from "../../../lib/content.mjs";
import { PageHero, Eyebrow, ContactBand, LinkButton } from "../../components";
export function generateStaticParams() {
  return practices.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return pageMeta("/practices/" + slug);
}
export default async function Practice({ params }) {
  const { slug } = await params;
  const p = practices.find((p) => p.slug === slug);
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
          <LinkButton href="/opportunities">
            Explore the Property Collection
          </LinkButton>
        )}
        <LinkButton href={"/contact?interest=" + encodeURIComponent(p.title)}>
          Discuss your requirement
        </LinkButton>
      </PageHero>
      <section className="section-pad">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/practices">Our practices</Link>
          <span>/ {p.title}</span>
        </div>
        <div className="section-heading">
          <div>
            <Eyebrow>HOW WE CAN HELP</Eyebrow>
            <h2>
              From the question
              <br />
              to the next decision.
            </h2>
          </div>
          <p>{p.audience}</p>
        </div>
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
          <Eyebrow>A CLEAR SCOPE</Eyebrow>
          <h2>Work with a defined outcome.</h2>
          <p>
            Every engagement begins with the objective, available information,
            responsibilities and a clear scope of deliverables.
          </p>
        </div>
        <ul className="output-list">
          {p.outputs.map((text, i) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
        {p.slug === "debt-special-situations" && (
          <p className="fine-note">
            India Gully acts as an adviser and facilitator, not a lender.
            Funding and transaction outcomes depend on counterparties,
            diligence, approvals and agreed terms.
          </p>
        )}
        {p.slug === "transaction-advisory" && (
          <p className="fine-note">
            Specialist legal, tax, audit and technical opinions are provided by
            the appropriately appointed professionals.
          </p>
        )}
      </section>
      <ContactBand interest={p.title} />
    </main>
  );
}
