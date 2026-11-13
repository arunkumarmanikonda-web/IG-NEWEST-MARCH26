import { teaserData } from "../lib/teaser.mjs";
export default function TeaserSheet({ item, business, draft = false }) {
  const t = teaserData(item),
    product = item.kind === "product";
  return (
    <article className="teaser-sheet">
      <header className="teaser-masthead">
        <img
          src="/brand/logo-dark.svg"
          alt="India Gully. Celebrating Desiness."
        />
        <span>{t.label}</span>
      </header>
      {draft && (
        <div className="teaser-draft">
          DRAFT FOR REVIEW · NOT A PUBLIC OFFER · REVISION {item.version}
        </div>
      )}
      <section
        className="teaser-hero"
        style={
          t.image
            ? {
                backgroundImage:
                  'linear-gradient(0deg,rgba(20,20,20,.94),rgba(20,20,20,.15)), url("' +
                  t.image +
                  '")',
              }
            : {}
        }
      >
        <div>
          <p>{t.line || "INDIA GULLY ADVISORY"}</p>
          <h1>{t.title}</h1>
        </div>
      </section>
      {t.illustrative && (
        <p className="teaser-illustration">
          Illustrative AI-generated concept; not documentary evidence of the
          asset or product.
        </p>
      )}
      <section className="teaser-body">
        <div className="teaser-label">
          {product ? "THE PRODUCT" : "THE BRIEF"}
        </div>
        <p className="teaser-intro">{t.summary}</p>
        <dl className="teaser-facts">
          {t.facts.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="teaser-next">
          <h2>
            {product
              ? "Let’s prepare your quotation."
              : "Let’s discuss the next step."}
          </h2>
          <p>
            {product
              ? "Share quantities, delivery location and required specifications. Availability and commercial terms are confirmed in a formal quotation."
              : "Share your objective with our advisory team. Detailed material is shared through the applicable confidentiality and authorised disclosure process."}
          </p>
          <a href={"mailto:" + business.email}>{business.email}</a>
          <span>{business.phone}</span>
          <strong>www.indiagully.com</strong>
        </div>
      </section>
      <footer className="teaser-footer">
        <p>
          {draft
            ? "Internal review copy. Check facts, permissions and current availability before circulation."
            : "Public overview. Availability, mandate status, specifications and commercial terms require confirmation."}{" "}
          This brief is not an offer, certified valuation or assurance of
          returns.
        </p>
        <div>
          <span>{business.legal_name}</span>
          <span>
            {draft ? "Draft" : "Public"} revision {item.version}
          </span>
        </div>
      </footer>
    </article>
  );
}
