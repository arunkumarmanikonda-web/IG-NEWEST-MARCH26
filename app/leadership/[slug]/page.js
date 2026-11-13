import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyContent } from "../../../lib/editorial";
import { cmsMetadata } from "../../../lib/cms";
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
            {!!sections.length && <a className="profile-biography-link" href={"#" + sections[0].id}>Explore the full profile <span aria-hidden="true">↓</span></a>}
          </div>
        </div>
      </section>
      {!!sections.length && <div className="profile-biography profile-container">
        <nav className="profile-section-nav" aria-label="Profile sections">
          {sections.map((section) => <a key={section.id} href={"#" + section.id}>{section.title}<span aria-hidden="true">↘</span></a>)}
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
