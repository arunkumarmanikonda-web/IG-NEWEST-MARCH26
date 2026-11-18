import Link from "next/link";
import {articlePractice,readingMinutes} from "../../lib/customer-experience.mjs";
import Image from "next/image";
import { siteSection } from "../../lib/website";
import { pageMeta } from "../../lib/seo.mjs";
import { published } from "../../lib/cms";
import { insights } from "../../lib/content.mjs";
import { Arrow, ContactBand, PageHero } from "../components";
import Seo from "../seo";
import { PerspectiveDate } from "./perspective-date";
import "./perspectives.css";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("/insights");
const PAGE_SIZE = 12;
const parameter = value => typeof value === "string" ? value.slice(0, 200).trim() : "";

export default async function Insights({ searchParams }) {
  const [copy, records, params] = await Promise.all([siteSection("insights"), published("article"), searchParams]);
  const query = parameter(params?.q);
  const selectedPractice = params?.practice ? articlePractice({category:parameter(params.practice)}).label : "";
  // The public register arrives newest first. Undated originals keep their editorial order.
  const items = records === null ? insights.map(row=>({...row,category:articlePractice(row).label})) : records.map(row => ({
    ...row, category: articlePractice(row).label, image: row.public_data.image,
  }));
  const practices = [...new Set(items.map(row => row.category))].sort((a,b) => a.localeCompare(b));
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = items.filter(item => {
    if (selectedPractice && selectedPractice !== item.category) return false;
    const content = [item.title, item.category, item.summary, item.body || item.sections?.flat().join(" ")].join(" ").toLowerCase();
    return words.every(word => content.includes(word));
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const requestedPage = Number(parameter(params?.page));
  const page = Number.isSafeInteger(requestedPage) ? Math.min(pageCount, Math.max(1, requestedPage)) : 1;
  function pageUrl(index) {
    const filters = new URLSearchParams();
    if (query) filters.set("q", query);
    if (selectedPractice) filters.set("practice", selectedPractice);
    if (index > 1) filters.set("page", String(index));
    return "/insights" + (filters.size ? "?" + filters : "") + "#archive";
  }
  return (
    <main id="main">
      <Seo path="/insights" />
      <PageHero eyebrow={copy["eyebrow-india-gully-perspectives"]} title={<>{copy["questions-worth-asking"]}<br /><em>{copy["decisions-worth-preparing-for"]}</em></>}
        description={copy["description-practical-perspectives-on-the-commercial-and-operational"]} />
      <section className="section-pad perspective-archive" id="archive" aria-labelledby="archive-title">
        <h2 id="archive-title">Perspectives archive</h2>
        <form className="perspective-filters" action="/insights#archive" method="get" role="search" aria-label="Search the Perspectives archive">
          <label>Search articles<input type="search" name="q" defaultValue={query} placeholder="Topic or keyword" maxLength={200} /></label>
          <label>Practice<select name="practice" defaultValue={selectedPractice}>
            <option value="">All practices</option>
            {practices.map(practice => <option key={practice}>{practice}</option>)}
          </select></label>
          <button type="submit" className="button">Search</button>
          {(query || selectedPractice) && <Link href="/insights#archive">Clear filters</Link>}
        </form>
        <p className="archive-total">{matches.length} {matches.length === 1 ? "article" : "articles"}</p>
        <div className="archive-items">
          {matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => <article key={item.slug} className="archive-item">
            <div className="archive-meta">
              {item.image && <Image className="archive-cover" src={item.image} alt="" width={200} height={102}
                unoptimized={item.image.startsWith("/images/generated/")} sizes="(max-width: 680px) 130px, 200px" />}
              <PerspectiveDate value={item.published_at} /><span>{item.category}</span><span>{readingMinutes(item)} min read</span>
            </div>
            <div><h3><Link href={"/insights/" + item.slug}>{item.title}</Link></h3><p>{item.summary}</p></div>
            <Link className="archive-arrow" href={"/insights/" + item.slug} aria-label={"Read " + item.title}><Arrow /></Link>
          </article>)}
        </div>
        {!matches.length && <p>{items.length ? "Try a broader keyword or choose another practice." : "Published Perspectives will appear here."}</p>}
        {pageCount > 1 && <nav className="archive-pages" aria-label="Archive pages">
          {page > 1 && <Link href={pageUrl(page - 1)}>← Newer articles</Link>}
          <span>Page {page} of {pageCount}</span>
          {page < pageCount && <Link href={pageUrl(page + 1)}>Older articles →</Link>}
        </nav>}
      </section>
      <ContactBand />
    </main>
  );
}
