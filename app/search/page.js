import { siteSection, livePractices } from "../../lib/website";
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
  const copy = await siteSection("search");
  const p = await searchParams;
  const items = buildSearchIndex(await publishedSearchRecords(), await livePractices());
  return (
    <main id="main">
      <PageHero
        eyebrow={copy["eyebrow-find-your-next-step"]}
        title={copy["title-search-india-gully"]}
        description={copy["description-explore-our-practices-real-estate-listings-horeca"]}
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
