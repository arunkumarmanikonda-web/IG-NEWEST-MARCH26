import { PageHero, ContactBand } from "./components";
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
      />
      <article className="prose-section">
        {!!item.tags?.length && (
          <p>{item.tags.map((t) => t.label).join(" · ")}</p>
        )}
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
            and delivery. Online checkout is not activated.
          </p>
        )}
      </article>
      <ContactBand interest={item.title} />
    </main>
  );
}
