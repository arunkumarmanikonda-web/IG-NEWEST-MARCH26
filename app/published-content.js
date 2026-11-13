import Link from "next/link";
import { PageHero, ContactBand, LinkButton } from "./components";
export default function PublishedContent({ item }) {
  const d = item.public_data;
  return (
    <main id="main">
      <PageHero
        eyebrow={[d.sector || item.kind, d.city, d.region]
          .filter(Boolean)
          .join(" / ")}
        title={item.title}
        description={item.summary}
        image={d.image || undefined}
        alt={d.image_alt || item.title}
      >
        {item.kind === "opportunity" && (
          <LinkButton
            href={"/account/nda?opportunity=" + encodeURIComponent(item.slug)}
          >
            Request confidential information
          </LinkButton>
        )}
      </PageHero>
      <article className="prose-section">
        {d.image?.startsWith("/images/generated/")&&<p className="fine-note">{item.kind==="product"&&d.image_alt?.startsWith("AI-enhanced product image")?"AI-enhanced product image. Confirm the final specification in your quotation.":"Illustrative AI-generated concept. This is not a photograph of the listed property, product or completed project."}</p>}
        {item.kind==="opportunity"&&<p><Link className="text-link" href={"/opportunities/"+item.slug+"/teaser"} target="_blank">Open one-page opportunity brief →</Link></p>}
        {!!item.tags?.length && (
          <p>{item.tags.map((t) => t.label).join(" · ")}</p>
        )}
        {item.kind==="product"&&<dl className="product-specifications">{[["sku","SKU"],["brand","Brand"],["category","Category"],["uom","Unit"],["hsn","HSN"],["gst_pct","GST %"],["moq","Minimum order"],["pack_size","Pack size"],["lead_days","Lead time · days"]].filter(([k])=>d[k]).map(([k,label])=><div key={k}><dt>{label}</dt><dd>{d[k]}</dd></div>)}</dl>}
        {!d.confidential&&d.location_reviewed===true&&d.latitude&&d.longitude&&<p><a className="text-link" href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(d.latitude+","+d.longitude)} target="_blank" rel="noreferrer">View approved project location ↗</a></p>}
        {item.body
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
      <ContactBand interest={item.title} />
    </main>
  );
}
