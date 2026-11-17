"use client";
import {useState} from "react";
export default function BrandGallery({detail,practice}){
 const groups=[...new Set(detail.brands.map(x=>x.category))];
 const [segment,setSegment]=useState(""),retail=practice==="retail-leasing";
 if(!groups.length)return null;
 return <section className={"ps-gallery "+(retail?"ps-retail":"ps-partners")}>
 <div className="ps-gallery-head"><h2>{detail.galleryTitle}</h2><p>{detail.galleryIntro}</p></div>
 {retail && <div className="ps-filters" aria-label="Filter retail brand references">{["",...groups].map(g=><button key={g} type="button" aria-pressed={g===segment} onClick={()=>setSegment(g)}>{g || "All segments"}</button>)}</div>}
 <ul className="ps-marks">{detail.brands.filter(b=>!retail || !segment || b.category===segment).map(b=><li key={b.name}>
 <a href={b.site} target="_blank" rel="noopener noreferrer"><div className="ps-mark">{b.logo?<img loading="lazy" src={b.logo} alt="" referrerPolicy="no-referrer"/>:<strong>{b.name}</strong>}</div>
 <div className="ps-caption"><strong>{b.name}</strong><small>{b.category}</small></div></a></li>)}</ul></section>;
}
