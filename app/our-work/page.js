import { companyContent } from "../../lib/editorial";
import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, ContactBand, Eyebrow } from "../components";
import { WorkGrid } from "../editorial-components";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/our-work");
export default async function Page() {
  const { work } = await companyContent();
  return (
    <main id="main">
      <PageHero
        eyebrow="SELECTED EXPERIENCE"
        title={
          <>
            Different businesses.
            <br />
            <em>A considered approach.</em>
          </>
        }
        description="A selection of engagements across transactions, retail destinations, hospitality projects and procurement. Each assignment reflects a specific scope of involvement."
        image="/images/dining.jpg"
        alt="Hospitality dining setting"
      />
      <section className="section-pad">
        <div className="section-heading">
          <div>
            <Eyebrow>OUR WORK</Eyebrow>
            <h2>
              Experience across
              <br />
              the commercial lifecycle.
            </h2>
          </div>
          <p>
            Historical assignments are presented separately from current
            opportunities. Named engagements do not imply a current exclusive
            mandate or endorsement.
          </p>
        </div>
        <WorkGrid items={work} />
      </section>
      <ContactBand title="Bring your brief into focus." />
    </main>
  );
}
