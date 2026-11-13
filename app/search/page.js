import { publishedSearchRecords } from "../../lib/cms";
import { buildSearchIndex } from "../../lib/site-search.mjs";
import { PageHero } from "../components";
import Results from "./results";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Search India Gully",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};
export default async function Search({ searchParams }) {
  const p = await searchParams;
  const items = buildSearchIndex(await publishedSearchRecords());
  return (
    <main id="main">
      <PageHero
        eyebrow="FIND YOUR NEXT STEP"
        title="Search India Gully."
        description="Explore our practices, real estate listings, HORECA products, selected work and insights in one place."
      />
      <section className="section-pad">
        <Results
          items={items}
          initialQuery={typeof p.q === "string" ? p.q.slice(0, 200) : ""}
        />
      </section>
    </main>
  );
}
