import Link from "next/link";
import { notFound } from "next/navigation";
import { companyContent } from "../../../lib/editorial";
import { cmsMetadata } from "../../../lib/cms";
import { PageHero, ContactBand } from "../../components";
import { TextBody } from "../../editorial-components";
export const dynamic = "force-dynamic";
async function engagement(params) {
  return (await companyContent()).work.find((x) => x.slug === params.slug);
}
export async function generateMetadata({ params }) {
  return cmsMetadata(await engagement(await params));
}
export default async function Page({ params }) {
  const x = await engagement(await params);
  if (!x) notFound();
  return (
    <main id="main">
      <PageHero
        eyebrow={x.public_data.sector + " / " + x.public_data.city}
        title={x.title}
        description={x.summary}
      >
        <Link href="/our-work" className="text-link">
          ← Selected work
        </Link>
      </PageHero>
      <section className="profile-content section-pad">
        <aside>
          <div className="eyebrow">ENGAGEMENT FOCUS</div>
          {(x.public_data.expertise || "").split(";").map((t) => (
            <p key={t}>{t}</p>
          ))}
        </aside>
        <TextBody text={x.body} />
      </section>
      <ContactBand interest={x.public_data.sector} />
    </main>
  );
}
