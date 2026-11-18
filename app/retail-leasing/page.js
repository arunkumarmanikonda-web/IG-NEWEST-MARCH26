import Link from "next/link";
import {published} from "../../lib/cms";
import {PageHero,LinkButton} from "../components";
import MandateBoard from "./board";
import {retailCard} from "../../lib/retail-mandates.mjs";
import "./retail.css";
export const metadata={alternates:{canonical:"/retail-leasing"},title:"Retail leasing mandates",description:"Explore promoter spaces, unit availability and published brand expansion requirements."};
export const dynamic="force-dynamic";
export default async function RetailLeasing({searchParams}){
 const side=(await searchParams)?.side==="requirements"?"retail_requirement":"retail_space";
 const lists=await Promise.all(["retail_space","retail_requirement"].map(async k=>(await published(k)||[]).map(retailCard)));
 return <main id="main"><PageHero eyebrow="Retail & leasing" title="Spaces to lease. Brands to grow." description="Explore office and retail spaces, or match your site to a brand expansion brief. We represent property promoters and occupiers through clearly defined leasing mandates." image="/images/dining.jpg">
 <LinkButton href="/practices/retail-leasing">Our leasing practice</LinkButton></PageHero>
 <MandateBoard key={side} lists={lists} initial={side}/>
 <section className="rl-appoint"><h2>Appoint India Gully</h2><div><Link href="/contact?interest=Retail%20%26%20Leasing&message=I%20would%20like%20to%20appoint%20India%20Gully%20to%20lease%20a%20property.">Discuss a promoter mandate ↗</Link><Link href="/contact?interest=Retail%20%26%20Leasing&message=I%20would%20like%20to%20discuss%20a%20brand%20expansion%20mandate.">Share a brand expansion brief ↗</Link></div></section></main>;
}
