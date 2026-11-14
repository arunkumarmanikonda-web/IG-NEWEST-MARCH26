import { siteSection } from "../../lib/website";
import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, Eyebrow, LinkButton, ContactBand } from "../components";
export const metadata = pageMeta("/nda");


export default async function Page() {
  const copy = await siteSection("nda");
  const faqs = copy.faqs;
  const steps = copy.steps;
  return (
    <main id="main">
      <PageHero
        eyebrow={copy["eyebrow-confidentiality-registered-access"]}
        title={
          <>{copy["a-considered-process"]}<br />
            <em>{copy["a-confidential-conversation"]}</em>
          </>
        }
        description={copy["description-understand-the-opportunity-before-the-detail-our"]}
      >
        <LinkButton href="/account/nda">{copy["manage-nda-access-requests"]}</LinkButton>
      </PageHero>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["the-disclosure-journey"]}</Eyebrow>
            <h2>{copy["four-steps"]}<br />{copy["clear-responsibilities"]}</h2>
          </div>
          <p>{copy["each-opportunity-has-its-own-disclosure-conditions"]}</p>
        </div>
        <div className="nda-steps">
          {steps.map(([title, text], i) => (
            <article key={title}>
              <Eyebrow>0{i + 1}</Eyebrow>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="scope-section">
        <div>
          <Eyebrow>{copy["information-handling"]}</Eyebrow>
          <h2>{copy["disclosure-should"]}<br />{copy["serve-a-defined-purpose"]}</h2>
          <p>{copy["keep-your-evaluation-purpose-specific-the-team"]}</p>
        </div>
        <ul className="output-list">
          <li>
            <span>{copy["01"]}</span>{copy["public-briefs-without-exact-addresses"]}</li>
          <li>
            <span>{copy["02"]}</span>{copy["verified-registration-and-policy-acceptance"]}</li>
          <li>
            <span>{copy["03"]}</span>{copy["versioned-agreement-and-acceptance-record"]}</li>
          <li>
            <span>{copy["04"]}</span>{copy["separate-review-of-each-information-request"]}</li>
        </ul>
      </section>
      <section className="prose-section faq-list">
        <Eyebrow>{copy["frequently-asked-questions"]}</Eyebrow>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <ContactBand
        title={copy["title-need-clarity-before-requesting-access"]}
        interest="NDA and confidential information"
      />
    </main>
  );
}
