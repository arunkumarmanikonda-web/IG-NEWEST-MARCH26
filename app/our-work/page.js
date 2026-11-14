import { siteSection } from "../../lib/website";
import { companyContent } from "../../lib/editorial";
import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, ContactBand, Eyebrow } from "../components";
import { WorkGrid } from "../editorial-components";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/our-work");
export default async function Page() {
  const copy = await siteSection("our-work");
  const { work } = await companyContent();
  return (
    <main id="main">
      <PageHero
        eyebrow={copy["eyebrow-selected-experience"]}
        title={
          <>{copy["different-businesses"]}<br />
            <em>{copy["a-considered-approach"]}</em>
          </>
        }
        description={copy["description-a-selection-of-engagements-across-transactions-retail"]}
        image={copy["image-images-dining-jpg"]}
        alt={copy["alt-hospitality-dining-setting"]}
      />
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>{copy["our-work"]}</Eyebrow>
            <h2>{copy["experience-across"]}<br />{copy["the-commercial-lifecycle"]}</h2>
          </div>
          <p>{copy["historical-assignments-are-presented-separately-from-current"]}</p>
        </div>
        <WorkGrid items={work} />
      </section>
      <ContactBand title={copy["title-bring-your-brief-into-focus"]} />
    </main>
  );
}
