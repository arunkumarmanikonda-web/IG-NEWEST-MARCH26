import Link from "next/link";
import "./residences.css";

export default function ResidencesLaunch({config, detail = false, preview = false}) {
  if (!config) return null;
  const Heading = detail ? "h1" : "h2";
  return <section className={"residences-launch" + (detail ? " residences-detail" : "")} aria-label={config.name} id={preview ? undefined : "residences"}>
    <div className="residences-copy">
      {config.logo ? <img className="residences-logo" src={config.logo} alt={config.name + " logo"} /> : <span className="residences-signature">INDIA GULLY <span>RESIDENCES</span></span>}
      {config.kicker && <p className="residences-kicker">{config.kicker}</p>}
      <Heading>{config.headline}</Heading>
      <p className="residences-location">{config.location}</p>
      <div className="residences-description">{config.description.split(/\n\s*\n/).filter(Boolean).map((paragraph,index) => <p key={index}>{paragraph}</p>)}</div>
      {!!config.highlights.length && <ul className="residences-highlights">{config.highlights.map((text,index) => <li key={index}>{text}</li>)}</ul>}
      <div className="residences-actions">{preview ? <span className="residences-button" aria-disabled="true">{detail ? config.ctaLabel : "Discover Residences"} <span aria-hidden="true">↗</span></span> : <Link className="residences-button" href={detail ? config.ctaHref : "/residences"}>{detail ? config.ctaLabel : "Discover Residences"} <span aria-hidden="true">↗</span></Link>}
        {!detail && (preview ? <span className="residences-enquire" aria-disabled="true">{config.ctaLabel} <span aria-hidden="true">→</span></span> : <Link className="residences-enquire" href={config.ctaHref}>{config.ctaLabel} <span aria-hidden="true">→</span></Link>)}</div>
    </div>
    <div className={"residences-visual" + (!config.image && !config.video ? " residences-typography" : "")}>
      {config.video ? <video controls preload="none" playsInline poster={config.image || undefined} aria-label={config.imageAlt || config.name + " project film"}><source src={config.video} />Your browser cannot play this film. <a href={config.video}>Open the project film</a>.</video> : config.image ? <img src={config.image} alt={config.imageAlt} loading={detail ? "eager" : "lazy"} /> : <div aria-hidden="true"><img src="/brand/mark.svg" alt="" /><span>A place to<br /><em>call your own.</em></span><small>{config.location}</small></div>}
    </div>
  </section>;
}
