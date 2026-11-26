import Link from "next/link";
import { notFound } from "next/navigation";
import { readPublicCareers } from "../../../lib/careers-data.js";
import { siteConfig } from "../../../lib/seo.mjs";
import { CareerMeta, CareerParagraphs, CareerLines, careerDate } from "../career-copy";
import ApplicationForm from "../application-form";
import "../careers.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { settings, jobs } = await readPublicCareers();
    const job = settings.enabled && jobs.find(item => item.slug === slug);
    if (!job) return { title: "Role unavailable", robots: { index: false, follow: false } };
    return { title: `${job.title} · Careers`, description: job.summary, alternates: { canonical: new URL(`/careers/${job.slug}`, siteConfig().origin).href } };
  } catch { return { title: "Careers", robots: { index: false, follow: false } }; }
}

export default async function CareerDetail({ params }) {
  const { slug } = await params;
  const { settings, jobs } = await readPublicCareers();
  const job = settings.enabled && jobs.find(item => item.slug === slug);
  if (!job) notFound();
  return <main id="main" className="careers-page">
    <section className="career-detail-hero"><Link className="career-text-link" href="/careers">All career opportunities</Link><div className="eyebrow">{job.department || "CAREERS AT INDIA GULLY"}</div><h1>{job.title}</h1><CareerMeta job={job} /><p className="career-summary">{job.summary}</p><a className="button career-primary" href="#apply">Apply for this role</a></section>
    <div className="career-detail-layout">
      <article className="career-description"><section><h2>About the role</h2><div className="career-prose"><CareerParagraphs text={job.description} /></div></section>
        {job.responsibilities && <section><h2>What you’ll do</h2><div className="career-prose"><CareerLines text={job.responsibilities} /></div></section>}
        {job.requirements && <section><h2>What you’ll bring</h2><div className="career-prose"><CareerLines text={job.requirements} /></div></section>}
        {job.salary_text && <section><h2>Compensation</h2><div className="career-prose"><CareerParagraphs text={job.salary_text} /></div></section>}
      </article>
      <aside className="career-role-note"><h2>At a glance</h2><CareerMeta job={job} />{job.department && <p><strong>Department</strong><br />{job.department}</p>}{job.closes_at && <p><strong>Applications close</strong><br />{careerDate(job.closes_at)}<br /><small>India Standard Time</small></p>}<p>Apply directly to India Gully using the form below. You do not need to create an account.</p></aside>
    </div>
    <section className="career-apply" id="apply" aria-labelledby="application-title"><div className="career-apply-heading"><div className="eyebrow">LET’S GET TO KNOW YOU</div><h2 id="application-title">Apply for {job.title}</h2><div className="career-prose"><CareerParagraphs text={settings.application_intro} /></div></div><ApplicationForm key={job.id} job={job} /></section>
  </main>;
}
