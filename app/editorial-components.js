import Link from "next/link";
import Image from "next/image";
import { Arrow, Eyebrow, LinkButton } from "./components";
export function TextBody({ text = "" }) {
  return (
    <div className="editorial-body">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) =>
          p.startsWith("## ") ? (
            <h2 key={i}>{p.slice(3)}</h2>
          ) : (
            <p key={i}>{p}</p>
          ),
        )}
    </div>
  );
}
export function TrustStrip() {
  return (
    <div className="trust-strip">
      {[
        ["2017", "Our foundation"],
        ["20+ years", "Founder’s sector experience"],
        ["Pan India", "Market perspective"],
        ["One team", "Advisory to execution"],
      ].map(([a, b]) => (
        <div key={a}>
          <strong>{a}</strong>
          <span>{b}</span>
        </div>
      ))}
    </div>
  );
}
export function LeadershipCards({ people }) {
  return (
    <div className="leadership-grid">
      {people.map((p) => (
        <article key={p.slug}>
          <Link href={"/leadership/" + p.slug} className="leadership-photo">
            <Image
              src={p.public_data.image || "/mark.png"}
              alt={p.public_data.image_alt || p.title}
              fill
              sizes="(max-width:760px) 90vw, 30vw"
            />
          </Link>
          <p className="role-label">{p.public_data.job_title}</p>
          <h3>
            <Link href={"/leadership/" + p.slug}>{p.title}</Link>
          </h3>
          <p className="bio-summary">{p.summary}</p>
          <Link className="text-link" href={"/leadership/" + p.slug}>
            Read full profile <Arrow />
          </Link>
        </article>
      ))}
    </div>
  );
}
export function ConfidentialityBand() {
  return (
    <section className="confidentiality-band">
      <div>
        <Eyebrow>CONFIDENTIALITY BY DESIGN</Eyebrow>
        <h2>
          The right information.
          <br />
          <em>At the right stage.</em>
        </h2>
      </div>
      <div>
        <p>
          Explore the public brief first. Register your interest, agree the
          applicable confidentiality terms and request access to the information
          relevant to your mandate.
        </p>
        <LinkButton href="/nda">Understand the NDA process</LinkButton>
      </div>
    </section>
  );
}
export function WorkGrid({ items }) {
  return (
    <div className="work-grid">
      {items.map((x, i) => (
        <Link href={"/our-work/" + x.slug} className="work-card" key={x.slug}>

          <div className="eyebrow">
            {x.public_data.sector} / {x.public_data.city}
          </div>
          <h3>{x.title}</h3>
          <p>{x.summary}</p>
          <span className="read-link">
            View engagement <Arrow />
          </span>
        </Link>
      ))}
    </div>
  );
}
