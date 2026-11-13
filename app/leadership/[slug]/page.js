import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyContent } from "../../../lib/editorial";
import { cmsMetadata } from "../../../lib/cms";
import { leadershipLinkedIn } from "../../../lib/leadership-links.mjs";
import { Arrow, Eyebrow, ContactBand } from "../../components";
export const dynamic = "force-dynamic";
async function person(params) {
  return (await companyContent()).people.find((x) => x.slug === params.slug);
}
export async function generateMetadata({ params }) {
  return cmsMetadata(await person(await params));
}
function biographySections(body = "") {
  const sections = [{ title: "Profile overview", paragraphs: [] }];
  for (const paragraph of body.split(/\n\s*\n/).filter(Boolean)) {
    const heading = paragraph.match(/^##\s+([^\n]+)(?:\n([\s\S]*))?$/);
    if (heading) {
      sections.push({ title: heading[1].trim(), paragraphs: heading[2] ? [heading[2].trim()] : [] });
    } else {
      sections.at(-1).paragraphs.push(paragraph);
    }
  }
  return sections.filter((section) => section.paragraphs.length).map((section, index) => ({ ...section, id: "profile-section-" + index }));
}
export default async function Page({ params }) {
  const { people } = await companyContent();
  const { slug } = await params;
  const p = people.find((person) => person.slug === slug);
  if (!p) notFound();
  const sections = biographySections(p.body);
  const expertise = (p.public_data.expertise || "").split(";").map((value) => value.trim()).filter(Boolean);
  const colleagues = people.filter((person) => person.slug !== slug);
  const contactHref = "/contact?interest=" + encodeURIComponent("Connect with " + p.title);
  const linkedInHref = leadershipLinkedIn[slug];
  return (
    <main id="main" className="leadership-profile">
      <div className="profile-breadcrumb profile-container">
        <Link href="/leadership" className="breadcrumb">← Our leadership</Link>
        <span>India Gully / {p.title}</span>
      </div>
      <section className="profile-hero profile-container" aria-labelledby="profile-name">
        <div className="profile-photo">
          <Image
            src={p.public_data.image || "/mark.png"}
            alt={p.public_data.image_alt || p.title}
            fill
            sizes="(max-width:760px) 88vw, (max-width:1200px) 36vw, 440px"
            preload
          />
        </div>
        <div className="profile-introduction">
          <Eyebrow>{p.public_data.job_title}</Eyebrow>
          <h1 id="profile-name">{p.title}</h1>
          <p className="profile-summary">{p.summary}</p>
          {!!expertise.length && <div className="profile-expertise">
            <h2>Areas of focus</h2>
            <ul>{expertise.map((value) => <li key={value}>{value}</li>)}</ul>
          </div>}
          <div className="profile-actions">
            <Link className="button" href={contactHref}>Discuss an assignment <Arrow /></Link>
            {linkedInHref && <a className="profile-linkedin" href={linkedInHref} target="_blank" rel="noopener noreferrer" aria-label={p.title + " on LinkedIn (opens in a new tab)"}>
              <svg className="linkedin-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.31h.04c.4-.76 1.36-1.56 2.79-1.56 2.98 0 3.58 1.96 3.58 4.51v5.29Z"/></svg>
              <span>LinkedIn profile</span><Arrow />
            </a>}
            {!!sections.length && <a className="profile-biography-link" href={"#" + sections[0].id}>Explore the full profile <Arrow /></a>}
          </div>
        </div>
      </section>
      {!!sections.length && <div className="profile-biography profile-container">
        <nav className="profile-section-nav" aria-label="Profile sections">
          {sections.map((section) => <a key={section.id} href={"#" + section.id}>{section.title}<Arrow /></a>)}
        </nav>
        {sections.map((section) => <section className="profile-chapter" id={section.id} aria-labelledby={section.id + "-title"} key={section.id}>
          <h2 id={section.id + "-title"}>{section.title}</h2>
          <div className="profile-chapter-copy">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        </section>)}
      </div>}
      {!!colleagues.length && <section className="profile-colleagues profile-container" aria-labelledby="profile-colleagues-title">
        <div className="profile-colleagues-heading"><h2 id="profile-colleagues-title">Meet the wider leadership.</h2><Link href="/leadership">Our leadership <Arrow /></Link></div>
        <div className="profile-colleague-grid">{colleagues.map((person) => <Link className="profile-colleague" key={person.slug} href={"/leadership/" + person.slug}>
          <span className="profile-colleague-photo"><Image src={person.public_data.image || "/mark.png"} alt="" fill sizes="88px" /></span>
          <span className="profile-colleague-copy"><span>{person.public_data.job_title}</span><strong>{person.title}</strong><span>View full profile</span></span>
          <Arrow />
        </Link>)}</div>
      </section>}
      <ContactBand
        title="A perspective on your next decision."
        interest={"Connect with " + p.title}
      />
    </main>
  );
}
