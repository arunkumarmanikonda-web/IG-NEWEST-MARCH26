import Link from "next/link";
import {published} from "../../lib/cms";
import {leasingListings} from "../../lib/practice-showcases.mjs";
import BrandGallery from "./brand-gallery";
import "./showcase.css";
export default async function PracticeShowcase({profile,detail}){
 if(!detail)return null;
 const retail=profile.slug==="retail-leasing";
 const leasing=retail?leasingListings(await published("opportunity")||[]):[];
 const gallery=<BrandGallery detail={detail} practice={profile.slug}/>;
 return <div className="practice-showcase">
 {retail && <section className="ps-mandate"><h2>{detail.mandateTitle}</h2><p>{detail.mandateIntro}</p>
 <div className="ps-mandate-grid">
 <article><p>For brands</p><h3>Find a space for your next store</h3><p>Review promoter mandates, unit availability, floor drawings and zoning plans.</p><Link href="/retail-leasing?side=spaces#mandates">Explore promoter spaces ↗</Link></article>
 <article><p>For promoters</p><h3>Find brands seeking space</h3><p>Explore expansion briefs by market, store format, area and preferred floor.</p><Link href="/retail-leasing?side=requirements#mandates">Explore brand requirements ↗</Link></article>
 </div><div className="ps-actions"><Link href={detail.ownerPath}>{detail.ownerLabel} ↗</Link><Link href={detail.occupierPath}>{detail.occupierLabel} ↗</Link></div>
 {!!leasing.length && <><h3>{detail.listingsTitle}</h3><ul className="ps-listings">{leasing.map(r=><li key={r.slug}><Link href={"/opportunities/"+r.slug}>{r.title} ↗</Link></li>)}</ul></>}</section>}
 {profile.slug==="transaction-advisory" && gallery}
 <section className="ps-story"><h2>{detail.title}</h2><p>{detail.introduction}</p>
 <div className="ps-stages">{detail.stages.map(([t,body])=><article key={t}><h3>{t}</h3><p>{body}</p></article>)}</div></section>
 {profile.slug!=="transaction-advisory" && gallery}</div>;
}
