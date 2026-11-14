import { siteSection } from "../../lib/website";
import { pageMeta } from "../../lib/seo.mjs";
import Seo from "../seo";
import { PageHero, Eyebrow, ContactBand, LinkButton } from "../components";
export const metadata = pageMeta("/projects");

export default async function Projects() {
  const copy = await siteSection("projects");
  const stages = copy.stages;
  return (
    <main id="main">
      <Seo path="/projects" />
      <PageHero
        eyebrow={copy["eyebrow-hospitality-design-coordination-pmc"]}
        title={
          <>{copy["a-considered-concept"]}<br />
            <em>{copy["a-coordinated-delivery"]}</em>
          </>
        }
        description={copy["description-bring-the-owner-s-commercial-objectives-the"]}
        image={copy["image-images-dining-jpg"]}
        alt={copy["alt-hospitality-dining-environment"]}
      >
        <LinkButton href="/contact?interest=Hospitality%20project">{copy["discuss-a-project"]}</LinkButton>
      </PageHero>
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["the-project-lifecycle"]}</Eyebrow>
            <h2>{copy["join-the-decisions-together"]}</h2>
          </div>
          <p>{copy["greenfield-development-repositioning-or-a-project-already"]}</p>
        </div>
        <div className="process-list">
          {stages.map(([title, text]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="scope-section">
        <div>
          <Eyebrow>{copy["owner-focused-project-management"]}</Eyebrow>
          <h2>{copy["clarity-on-progress"]}<br />{copy["visibility-on-decisions"]}</h2>
          <p>{copy["project-management-consultancy-brings-structure-to-the"]}</p>
        </div>
        <ul className="output-list">
          {[
            "Owner’s brief and responsibility matrix",
            "Master programme and decision register",
            "Budget, change and procurement tracking",
            "Progress, risk and issue reporting",
            "Handover and opening readiness checklist",
          ].map((x, i) => (
            <li key={x}>
              <span>0{i + 1}</span>
              {x}
            </li>
          ))}
        </ul>
      </section>
      <section className="section-pad">
        <div className="service-grid">
          <article className="service-item">
            <Eyebrow>{copy["design-coordination"]}</Eyebrow>
            <h3>{copy["keep-the-brief-connected-to-operations"]}</h3>
            <p>{copy["coordinate-architectural-interior-mep-kitchen-and-specialist"]}</p>
          </article>
          <article className="service-item">
            <Eyebrow>{copy["procurement"]}</Eyebrow>
            <h3>{copy["make-specification-and-delivery-visible"]}</h3>
            <p>{copy["organise-boqs-vendor-comparisons-samples-approvals-delivery"]}</p>
          </article>
        </div>
        <p className="fine-note">{copy["detailed-design-engineering-statutory-submissions-certifications-and"]}</p>
      </section>
      <ContactBand
        title={copy["title-where-is-your-project-today"]}
        interest="Hospitality project"
      />
    </main>
  );
}
