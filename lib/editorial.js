import { published } from "./cms";
import { leadership, companyPages, caseStudies } from "./company.mjs";
export async function companyContent() {
  const [people, pages, work] = await Promise.all([
    published("person"),
    published("page"),
    published("project"),
  ]);
  const sorted = (x) =>
    [...x].sort(
      (a, b) =>
        Number(a.public_data.sort_order || 999) -
        Number(b.public_data.sort_order || 999),
    );
  return {
    people: sorted(people === null ? leadership : people),
    pages: new Map(
      (pages === null ? companyPages : pages).map((x) => [x.slug, x]),
    ),
    work: sorted(work === null ? caseStudies : work),
  };
}
