"use client";
import {useState} from "react";
export default function BrandGallery({detail,practice}){
 const groups=[...new Set(detail.brands.map(x=>x.category))];
 const [segment,setSegment]=useState(""),retail=practice==="retail-leasing";
 const optical=b=>/\bEY\b/.test(b.name)?"ey":/CBRE/.test(b.name)?"cbre":/Sammaan/.test(b.name)?"sammaan":"standard";
 if(!groups.length)return null;
 return <section className={"ps-gallery "+(retail?"ps-retail":"ps-partners")}>
 <div className="ps-gallery-head"><h2>{detail.galleryTitle}</h2><p>{detail.galleryIntro}</p></div>
 {groups.length>1 && <div className="ps-filters" aria-label="Filter brand and partner references">{["",...groups].map(g=><button key={g} type="button" aria-pressed={g===segment} onClick={()=>setSegment(g)}>{g || "All segments"}</button>)}</div>}
 {!retail&&practice==="transaction-advisory"&&<div className="ps-role-context"><p>{segment==="Capital providers"?"Financing discussions follow the project’s funding requirement, lender criteria and agreed mandate.":segment==="Property advisory"?"Property expertise supports market positioning, asset assessment and transaction execution where included in the mandate.":"Professional and transaction advisory brings financial, diligence and execution disciplines to a defined assignment. Each firm’s role is agreed for that mandate."}</p><a href="/our-work/entertainment-city">See our published transaction advisory engagement →</a></div>}
 <ul className="ps-marks">{detail.brands.filter(b=>!segment || b.category===segment).map(b=><li key={b.name}>
 <a href={b.site} target="_blank" rel="noopener noreferrer"><div className={"ps-mark ps-optical-"+optical(b)}>{b.logo?<img loading="lazy" src={b.logo} alt="" referrerPolicy="no-referrer"/>:<strong>{b.name}</strong>}</div>
 <div className="ps-caption"><strong>{b.name}</strong><small>{b.category}</small></div></a></li>)}</ul></section>;
}
