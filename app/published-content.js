import Link from "next/link";
import ProductQuotation from "./horeca/product-quotation";
import {productDetailFields,productSpecificationFields,articlePractice,readingMinutes} from "../lib/customer-experience.mjs";
import { PageHero, ContactBand, LinkButton } from "./components";
import {productImageAlt} from "../lib/product-images.mjs";
import {horecaCategory,categoryHref} from "../lib/horeca-categories.mjs";
import AdviserContacts from "./adviser-contacts";
import SourcedArticle from "./insights/sourced-article";
import { PerspectiveDate } from "./insights/perspective-date";
import "./insights/perspectives.css";
export default function PublishedContent({ item,related=[] }) {
  const d = item.public_data;
  const topic=articlePractice(item);
  const sourcedArticle = item.kind === "article" && d.engine === "perspectives" && Array.isArray(d.sources)
    && Array.isArray(d.sections) && d.sections.length > 0 && d.sections.every(section =>
      typeof section?.heading === "string" && typeof section?.text === "string" && Array.isArray(section.sourceIndexes));
  const category=item.kind==='product'?horecaCategory(item):null;
  return (
    <main id="main" className={item.kind === "product" ? "catalogue-product-detail" : undefined}>
      <PageHero
        eyebrow={[category ? 'HORECA / '+category.label : item.kind === "article" ? topic.label : d.sector || item.kind, d.city, d.region]
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
          <PerspectiveDate value={item.published_at} /><span>{readingMinutes(item)} min read</span>
          {sourcedArticle && <span>AI-assisted research</span>}
        </div>}
        {item.kind === "article" && <aside className="article-takeaway"><h2>Why this matters</h2><p>{item.summary}</p></aside>}
        {item.kind!=="product" && d.image?.startsWith("/images/generated/") && <p className="fine-note">Illustrative AI-generated concept. This is not a photograph of the listed property, product or completed project.</p>}
        {item.kind==="opportunity"&&<p><Link className="text-link" href={"/opportunities/"+item.slug+"/brief.pdf"} prefetch={false} target="_blank">Download property brief →</Link></p>}
        {!!item.tags?.length && (
          <p>{item.tags.map((t) => t.label).join(" · ")}</p>
        )}
        {item.kind==="product"&&<dl className="product-specifications">{[["sku","SKU"],["brand","Brand"],["category","Category"],["uom","Unit"],["hsn","HSN"],["gst_pct","GST %"],["moq","Minimum order"],["pack_size","Pack size"],["lead_days","Lead time · days"]].filter(([k])=>d[k]).map(([k,label])=><div key={k}><dt>{label}</dt><dd>{d[k]}</dd></div>)}</dl>}
        {item.kind==="product"&&<><dl className="product-specifications">{Object.entries(productSpecificationFields(d.category)).map(([k,label])=><div key={k}><dt>{label}</dt><dd>{d[k]||"To confirm in your quotation"}</dd></div>)}</dl><ProductQuotation item={{id:item.id,title:item.title,public_data:{pack_size:d.pack_size,moq:d.moq,uom:d.uom}}}/></>}
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
      {item.kind==="article" ? <section className="section-pad article-next"><h2>{topic.cta}</h2><p>Bring this question to your own asset, business or project.</p><Link className="button" href={"/contact?interest="+encodeURIComponent(topic.label)+"&message="+encodeURIComponent("I would like to discuss “"+item.title+"” in relation to my project.")}>Discuss this Perspective →</Link> <Link className="text-link" href={topic.href}>Explore our practice →</Link>{!!related.length&&<><h3>Continue reading</h3>{related.map(r=><p key={r.slug}><Link href={"/insights/"+r.slug}>{r.title} →</Link></p>)}</>}</section>:<ContactBand interest={item.title} />}
    </main>
  );
}
