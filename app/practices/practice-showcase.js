import Link from "next/link";
import {published} from "../../lib/cms";
import {leasingListings} from "../../lib/practice-showcases.mjs";
import "./showcase.css";
export default async function PracticeShowcase({profile,detail}){
 if(!detail)return null;
 const leasing=profile.slug==="retail-leasing"?leasingListings(await published("opportunity")||[]):null;
 const groups=[...new Set(detail.brands.map(x=>x.category))];
 return <div className="practice-showcase">
  <section className="ps-story"><h2>{detail.title}</h2><p>{detail.introduction}</p>
    <div className="ps-stages">{detail.stages.map(([t,body])=><article key={t}><h3>{t}</h3><p>{body}</p></article>)}</div></section>
  {!!groups.length&&<section className="ps-brands"><h2>{detail.galleryTitle}</h2><p>{detail.galleryIntro}</p>
    {groups.map(group=><div key={group} className="ps-group"><h3>{group}</h3><ul>{detail.brands.filter(b=>b.category===group).map(b=><li key={b.name}><a href={b.site} target="_blank" rel="noopener noreferrer">
    {b.logo&&<img loading="lazy" src={b.logo} alt="" width="140" height="54" referrerPolicy="no-referrer"/>}<span>{b.name}</span></a></li>)}</ul></div>)}</section>}
  {leasing&&<section className="ps-mandate"><h2>{detail.mandateTitle}</h2><p>{detail.mandateIntro}</p>
    <div className="ps-actions"><Link className="button" href={detail.ownerPath}>{detail.ownerLabel} ↗</Link><Link className="text-link" href={detail.occupierPath}>{detail.occupierLabel} ↗</Link></div>
    <h3>{detail.listingsTitle}</h3>{leasing.length?<ul className="ps-listings">{leasing.map(r=><li key={r.slug}><Link href={"/opportunities/"+r.slug}>{r.title} ↗</Link>{r.summary&&<p>{r.summary}</p>}</li>)}</ul>:<p>{detail.emptyText}</p>}</section>}
 </div>;
}
