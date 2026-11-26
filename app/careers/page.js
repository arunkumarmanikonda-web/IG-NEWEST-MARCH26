import Link from "next/link";
import { readPublicCareers } from "../../lib/careers-data.js";
import { siteConfig } from "../../lib/seo.mjs";
import { CareerMeta, CareerParagraphs, careerDate } from "./career-copy";
import "./careers.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Careers",
  description: "Explore current opportunities to work with India Gully across our advisory, transactions and delivery practices.",
  alternates: { canonical: new URL("/careers", siteConfig().origin).href },
};

const parameter = value => typeof value === "string" ? value.trim().slice(0, 160) : "";

export default async function CareersPage({ searchParams }) {
  const params = await searchParams;
  let data;
  try { data = await readPublicCareers(); } catch {
    return <main id="main" className="careers-page"><section className="career-hero"><div className="eyebrow">Careers at India Gully</div><h1>Work with India Gully.</h1><p>Our opportunities are temporarily unavailable. Please try again shortly.</p><Link className="button" href="/careers">Reload careers</Link></section></main>;
  }
  const { settings, jobs = [] } = data;
  const available = settings.enabled ? jobs : [];
  const query = parameter(params?.q), department = parameter(params?.department);
  const departments = [...new Set(available.map(job => job.department).filter(Boolean))].sort();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = available.filter(job => (!department || job.department === department) && words.every(word => [job.title, job.department, job.location, job.summary].join(" ").toLowerCase().includes(word)));
  return <main id="main" className="careers-page">
    <section className="career-hero">
      <div className="career-hero-copy"><div className="eyebrow">Careers at India Gully</div><h1>{settings.headline}</h1><div className="career-prose"><CareerParagraphs text={settings.intro} /></div><a href="#open-roles" className="button career-primary">Explore open roles</a></div>
      <aside className="career-brand-panel" aria-label="India Gully"><img src="/brand/mark.svg" alt="" width="64" height="94" /><p>Indian perspective.<br />Commercial purpose.</p><span>ADVISORY · TRANSACTIONS · DELIVERY</span></aside>
    </section>
    <section className="career-openings section-pad" id="open-roles" aria-labelledby="open-roles-heading">
      <div className="career-section-heading"><div><div className="eyebrow">YOUR NEXT CHAPTER</div><h2 id="open-roles-heading">Open opportunities</h2></div><p>{available.length ? `${available.length} open ${available.length === 1 ? "role" : "roles"}` : "Current openings"}</p></div>
      {available.length > 0 && <form className="career-filters" action="/careers#open-roles" method="get" role="search" aria-label="Search career opportunities">
        <label>Search roles<input type="search" name="q" defaultValue={query} placeholder="Role, location or keyword" maxLength={160} /></label>
        <label>Practice or department<select name="department" defaultValue={department}><option value="">All departments</option>{departments.map(value => <option key={value}>{value}</option>)}</select></label>
        <button className="button" type="submit">Find roles</button>{(query || department) && <Link className="career-text-link" href="/careers#open-roles">Clear filters</Link>}
      </form>}
      {matches.length > 0 ? <div className="career-job-list">{matches.map(job => <article className="career-job-card" key={job.id}>
        <div className="career-job-main"><span className="eyebrow">{job.department || "INDIA GULLY"}</span><h3><Link href={`/careers/${job.slug}`}>{job.title}</Link></h3><CareerMeta job={job} /><p className="career-summary">{job.summary}</p></div>
        <div className="career-job-action">{job.closes_at && <span>Apply by {careerDate(job.closes_at)}</span>}<Link href={`/careers/${job.slug}`} className="button" aria-label={`View role: ${job.title}`}>View role</Link></div>
      </article>)}</div> : <div className="career-empty"><div className="career-empty-mark" aria-hidden="true"><svg width="36" height="36" viewBox="0 0 32 32" fill="none"><path d="M5 11h22v16H5zM11 11V6h10v5M5 17c6 4 16 4 22 0M16 17v5" stroke="currentColor" strokeWidth="1.5" /></svg></div><h3>{available.length ? "No roles match your search." : "The next opportunity starts here."}</h3><div className="career-prose"><CareerParagraphs text={available.length ? "Try another keyword or explore all departments." : settings.empty_message} /></div>{available.length > 0 && <Link className="career-text-link" href="/careers#open-roles">View all open roles</Link>}</div>}
    </section>
    <section className="career-about"><div><div className="eyebrow">GET TO KNOW US</div><h2>One connected practice.</h2></div><div className="career-prose"><p>Explore the people and practices behind India Gully, from real estate and retail leasing to hospitality, transaction advisory and HORECA procurement.</p><div className="career-about-links"><Link className="career-text-link" href="/about">About India Gully</Link><Link className="career-text-link" href="/leadership">Meet our leadership</Link></div></div></section>
  </main>;
}
