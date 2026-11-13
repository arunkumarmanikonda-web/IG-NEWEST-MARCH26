import { companyContent } from "../../lib/editorial";
import { pageMeta } from "../../lib/seo.mjs";
import { PageHero, ContactBand } from "../components";
import { LeadershipCards, ConfidentialityBand } from "../editorial-components";
export const dynamic = "force-dynamic";
export const metadata = pageMeta("/leadership");
export default async function Page() {
  const { people } = await companyContent();
  return (
    <main id="main">
      <PageHero
        eyebrow="THE PEOPLE BEHIND THE PRACTICE"
        title={
          <>
            Leadership that stays
            <br />
            <em>close to the work.</em>
          </>
        }
        description="Sector experience, direct engagement and clear accountability. Meet the people leading India Gully’s advisory, real estate and hospitality practices."
      />
      <section className="section-pad">
        <LeadershipCards people={people} />
      </section>
      <ConfidentialityBand />
      <ContactBand title="Start with the right conversation." />
    </main>
  );
}
