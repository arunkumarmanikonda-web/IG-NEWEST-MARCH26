import { siteSection } from "../../lib/website";
import { companyContent } from "../../lib/editorial";
import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, ContactBand } from "../components";
import { LeadershipCards, ConfidentialityBand } from "../editorial-components";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/leadership");
export default async function Page() {
  const copy = await siteSection("leadership");
  const { people } = await companyContent();
  return (
    <main id="main">
      <PageHero
        eyebrow={copy["eyebrow-the-people-behind-the-practice"]}
        title={
          <>{copy["leadership-that-stays"]}<br />
            <em>{copy["close-to-the-work"]}</em>
          </>
        }
        description={copy["description-sector-experience-direct-engagement-and-clear-accountability"]}
      />
      <section className="section-pad">
        <LeadershipCards people={people} />
      </section>
      <ConfidentialityBand />
      <ContactBand title={copy["title-start-with-the-right-conversation"]} />
    </main>
  );
}
