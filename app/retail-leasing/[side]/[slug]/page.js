import Link from "next/link";
import {notFound} from "next/navigation";
import {publishedItem,cmsMetadata} from "../../../../lib/cms";
import {retailKinds,retailFields,unitFields,enquiryMessage} from "../../../../lib/retail-mandates.mjs";
import {PageHero,LinkButton} from "../../../components";
import {liveFeatures} from "../../../../lib/featured-listings";
import {featureId} from "../../../../lib/feature-referral.mjs";
import {FeatureBriefOpen} from "../../../opportunities/featured-banner";
import "../../retail.css";
export const dynamic="force-dynamic";
async function load(params){const {side,slug}=await params;const kind={spaces:"retail_space",requirements:"retail_requirement"}[side];return kind?publishedItem(kind,slug):null;}
export async function generateMetadata({params}){return cmsMetadata(await load(params));}
export default async function Mandate({params,searchParams}){
 const record=await load(params);if(!record)notFound();
 const d=record.public_data, space=record.kind==="retail_space",fields=Object.entries(retailFields[record.kind]).filter(([k])=>d[k]);
 const incoming=featureId((await searchParams)?.feature);
 const feature=incoming && (await liveFeatures()).some(f=>f.id===incoming && f.content_id===record.id)?incoming:null;
 const contact=u=>"/contact?interest=Retail%20%26%20Leasing&message="+encodeURIComponent(enquiryMessage(record,u))+(feature?"&feature="+feature+"&listing="+encodeURIComponent(record.slug):"");
 return <main id="main">{feature && <FeatureBriefOpen campaignId={feature}/>}<PageHero eyebrow={retailKinds[record.kind]} title={record.title} description={record.summary} image={d.image}>
 <LinkButton href={contact()}>{space?"Enquire about this space":"Propose a site"}</LinkButton></PageHero><div className="rl-detail"><Link href={"/retail-leasing?side="+(space?"spaces":"requirements")+"#mandates"}>← Retail leasing desk</Link>
 {!!fields.length && <dl>{fields.map(([k,l])=><div key={k}><dt>{l}</dt><dd>{d[k]}</dd></div>)}</dl>}
 <div className="rl-copy">{record.body.split(/\n+/).filter(Boolean).map((p,i)=>p.startsWith("## ")?<h2 key={i}>{p.slice(3)}</h2>:<p key={i}>{p}</p>)}</div>
 {space && !!d.plans?.length && <section><h2>Drawings &amp; zoning plans</h2><div className="rl-plans">{d.plans.map(p=><a key={p.path} href={"/retail-leasing/plans/"+p.path} target="_blank" rel="noreferrer"><small>{p.type}</small><span>{p.label} ↗</span></a>)}</div></section>}
 {space && !!d.units?.length && <section><h2>Unit availability</h2><div className="rl-scroll"><table><thead><tr>{Object.values(unitFields).map(l=><th scope="col" key={l}>{l}</th>)}<th scope="col">Enquiry</th></tr></thead><tbody>{d.units.map(u=><tr key={u.floor+"|"+u.unit}>{Object.keys(unitFields).map(k=><td key={k}>{u[k]||"—"}</td>)}<td>{!["Leased","Withdrawn"].includes(u.status) && <Link href={contact(u)}>Enquire about {u.unit} ↗</Link>}</td></tr>)}</tbody></table></div></section>}</div></main>;
}
