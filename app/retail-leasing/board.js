"use client";
import Link from "next/link";
import {useState} from "react";
import {contentPath} from "../../lib/content-routes.mjs";
export default function MandateBoard({lists,initial}){
 const [q,setQ]=useState(""),space=initial==="retail_space", all=lists[space?0:1];
 const rows=all.filter(r=>[r.title,r.location,r.formats,r.floors,r.size].join(" ").toLowerCase().includes(q.trim().toLowerCase()));
 return <section className="rl-board" id="mandates"><nav className="rl-tabs" aria-label="Mandate side">
 <Link scroll={false} aria-current={space?"page":undefined} href="/retail-leasing?side=spaces#mandates">Promoter spaces</Link>
 <Link scroll={false} aria-current={!space?"page":undefined} href="/retail-leasing?side=requirements#mandates">Brand requirements</Link></nav>
 <div className="rl-board-head"><div><h2>{space?"Spaces for lease":"Brands seeking space"}</h2><p>{space?"Explore available units, floor drawings and zoning plans.":"Match a site to a brand’s preferred markets, floors and store formats."}</p></div>
 {!!all.length && <label>Search mandates<input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="City, format or floor"/></label>}</div>
 {rows.length?<div className="rl-list">{rows.map(r=><article key={r.id} className={r.image?"rl-card-with-image":undefined}>
   {r.image && <Link className="rl-card-image" href={contentPath(r)} aria-label={"View "+r.title}>
     <img src={r.image} alt={r.imageAlt} width="720" height="540" loading="lazy" />
   </Link>}
   <div className="rl-card-copy"><p className="eyebrow">{r.location}</p><h3><Link href={contentPath(r)}>{r.title}</Link></h3><p>{r.summary}</p><small>{[r.formats,r.floors,r.size,r.units?r.units+" "+(r.units===1?"unit":"units")+" in schedule":""].filter(Boolean).join(" · ")}</small><Link href={contentPath(r)}>{space?"View space & units":"View site requirement"} ↗</Link></div>
 </article>)}</div>:<div className="rl-empty"><p>{all.length?"No mandates match your search.":space?"There are currently no published promoter spaces.":"There are currently no published brand requirements."}</p>{all.length?<button onClick={()=>setQ("")}>Clear search</button>:<Link href={"/contact?interest=Retail%20%26%20Leasing&message="+encodeURIComponent(space?"I’m looking for space for my brand.":"I have a site to propose to expanding brands.")}>{space?"Tell us what space you need":"Tell us about your site"} ↗</Link>}</div>}
 </section>;
}
