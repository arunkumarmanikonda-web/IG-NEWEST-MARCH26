import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyContent } from "../../../lib/editorial";
import { cmsMetadata } from "../../../lib/cms";
import { Eyebrow, ContactBand } from "../../components";
import { TextBody } from "../../editorial-components";
export const dynamic = "force-dynamic";
async function person(params) {
  return (await companyContent()).people.find((x) => x.slug === params.slug);
}
export async function generateMetadata({ params }) {
  return cmsMetadata(await person(await params));
}
export default async function Page({ params }) {
  const p = await person(await params);
  if (!p) notFound();
  return (
    <main id="main">
      <section className="profile-hero">
        <div>
          <Link href="/leadership" className="breadcrumb">
            ← All leadership
          </Link>
          <Eyebrow>{p.public_data.job_title}</Eyebrow>
          <h1>{p.title}</h1>
          <p>{p.summary}</p>
          <div className="expertise-tags">
            {(p.public_data.expertise || "")
              .split(";")
              .filter(Boolean)
              .map((x) => (
                <span key={x}>{x}</span>
              ))}
          </div>
        </div>
        <div className="profile-photo">
          <Image
            src={p.public_data.image || "/mark.png"}
            alt={p.title}
            fill
            sizes="(max-width:760px) 90vw, 40vw"
            preload
          />
        </div>
      </section>
      <section className="profile-content section-pad">
        <aside>
          <Eyebrow>LEADERSHIP PROFILE</Eyebrow>
          <p>{p.public_data.job_title}</p>
          <Link
            href={
              "/contact?interest=" +
              encodeURIComponent("Connect with " + p.title)
            }
          >
            Connect through India Gully ↗
          </Link>
        </aside>
        <TextBody text={p.body} />
      </section>
      <ContactBand
        title="A perspective on your next decision."
        interest={"Connect with " + p.title}
      />
    </main>
  );
}
