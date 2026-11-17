import Link from "next/link";
import { PageHero, ContactBand, LinkButton } from "./components";
import {productImageAlt} from "../lib/product-images.mjs";
import {horecaCategory,categoryHref} from "../lib/horeca-categories.mjs";
import AdviserContacts from "./adviser-contacts";
import SourcedArticle from "./insights/sourced-article";
import { PerspectiveDate } from "./insights/perspective-date";
import "./insights/perspectives.css";
export default function PublishedContent({ item }) {
  const d = item.public_data;
  const sourcedArticle = item.kind === "article" && d.engine === "perspectives" && Array.isArray(d.sources)
    && Array.isArray(d.sections) && d.sections.length > 0 && d.sections.every(section =>
      typeof section?.heading === "string" && typeof section?.text === "string" && Array.isArray(section.sourceIndexes));
  const category=item.kind==='product'?horecaCategory(item):null;
  return (
    <main id="main" className={item.kind === "product" ? "catalogue-product-detail" : undefined}>
      <PageHero
        eyebrow={[category ? 'HORECA / '+category.label : d.sector || item.kind, d.city, d.region]
          .filter(Boolean)
          .join(" / ")}
        title={item.title}
        description={item.summary}
        image={d.image || undefined}
        alt={category ? productImageAlt(item) : d.image_alt || item.title}
      >
        {category&&<LinkButton href={categoryHref(category.id)}>Explore {category.label.toLowerCase()}</LinkButton>}
        {item.kind === "opportunity" && (
          <LinkButton
            href={"/account/nda?opportunity=" + encodeURIComponent(item.slug)}
          >
            Request confidential information
          </LinkButton>
        )}
      </PageHero>
      <article className="prose-section">
        {item.kind === "article" && <div className="perspective-article-meta">
          <Link className="text-link" href="/insights#archive">Perspectives archive</Link>
          <PerspectiveDate value={item.published_at} />
          {sourcedArticle && <span>AI-assisted research</span>}
        </div>}
        {item.kind!=="product" && d.image?.startsWith("/images/generated/") && <p className="fine-note">Illustrative AI-generated concept. This is not a photograph of the listed property, product or completed project.</p>}
        {item.kind==="opportunity"&&<p><Link className="text-link" href={"/opportunities/"+item.slug+"/brief.pdf"} prefetch={false} target="_blank">Download property brief →</Link></p>}
        {!!item.tags?.length && (
          <p>{item.tags.map((t) => t.label).join(" · ")}</p>
        )}
        {item.kind==="product"&&<dl className="product-specifications">{[["sku","SKU"],["brand","Brand"],["category","Category"],["uom","Unit"],["hsn","HSN"],["gst_pct","GST %"],["moq","Minimum order"],["pack_size","Pack size"],["lead_days","Lead time · days"]].filter(([k])=>d[k]).map(([k,label])=><div key={k}><dt>{label}</dt><dd>{d[k]}</dd></div>)}</dl>}
        {!d.confidential&&d.location_reviewed===true&&d.latitude&&d.longitude&&<p><a className="text-link" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(d.latitude+","+d.longitude)} target="_blank" rel="noreferrer">View approved project location ↗</a></p>}
        {sourcedArticle ? <SourcedArticle sections={d.sections} sources={d.sources} /> : item.body
          .split(/\n\s*\n/)
          .filter(Boolean)
          .map((text, i) =>
            text.startsWith("## ") ? (
              <h2 key={i}>{text.slice(3)}</h2>
            ) : (
              <p key={i} style={{ whiteSpace: "pre-line" }}>
                {text}
              </p>
            ),
          )}
        {item.kind === "opportunity" && (
          <p className="fine-note">
            Public information is limited to the approved teaser. Availability,
            mandate status and commercial terms require confirmation. Exact
            addresses and restricted documents are disclosed only through an
            authorised process.
          </p>
        )}
        {item.kind === "product" && (
          <p className="fine-note">
            Request a quotation to confirm specification, availability, taxes
            and delivery. Purchase and payment follow an approved quotation.
          </p>
        )}
      </article>
      {item.kind === 'product' && <section className="section-pad procurement-contacts"><h2>Plan your requirement with Pavan.</h2><AdviserContacts kind="product" subject={item.title + ' | Procurement enquiry'} /></section>}
      <ContactBand interest={item.title} />
    </main>
  );
}
