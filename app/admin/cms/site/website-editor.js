"use client";
import Link from "next/link";
import { useState } from "react";
import { siteDefaults, sectionLabel, validateSection } from "../../../../lib/site-editorial.mjs";
const label = key => String(key).replaceAll("-", " ").replace(/^./, c=>c.toUpperCase());
function Field({name, value, onChange, template=value, fixed=false}) {
  if (typeof value === "string") return <label>{label(name)}
    <textarea rows={value.length > 90 ? 3 : 1} value={value} onChange={e=>onChange(e.target.value)} required />
  </label>;
  if (!Array.isArray(value)) return <div className="site-editor-fields">{Object.entries(value).map(([k,v]) =>
    <Field name={k} key={k} value={v} template={template[k]} onChange={next=>onChange({...value,[k]:next})} />)}</div>;
  const names={journey:["Year","Heading","Description","Discipline"],principles:["Principle","Description"],links:["Destination","Link text"],services:["Service","Description"],stages:["Stage","Description"],faqs:["Question","Answer"],steps:["Step","Description"],categories:["Category","Description"]};
  const set=(i,v)=>onChange(value.map((row,index)=>index===i?v:row));
  function move(i, j) { const next=[...value]; [next[i],next[j]]=[next[j],next[i]]; onChange(next); }
  return <fieldset className="site-editor-group"><legend>{label(name)}</legend>{value.map((v,i)=><details key={i} className="site-editor-row">
    <summary>{Array.isArray(v)?v[name==="links"?1:0]:typeof v==="object"?v.title: v || "Entry "+(i+1)}</summary>
    {Array.isArray(v)?v.map((cell,j)=><Field key={j} name={names[name]?.[j] || "Text "+(j+1)} value={cell} onChange={next=>set(i,v.map((old,k)=>k===j?next:old))}/>):<Field name={typeof v==="string"?"Text":"Entry"} value={v} template={template[0]} onChange={next=>set(i,next)}/>}
    <div className="workspace-actions"><button type="button" disabled={!i} onClick={()=>move(i,i-1)}>Move up</button><button type="button" disabled={i===value.length-1} onClick={()=>move(i,i+1)}>Move down</button>
    {!fixed&&<button type="button" disabled={value.length===1} onClick={()=>onChange(value.filter((_,index)=>index!==i))}>Remove entry</button>}</div>
  </details>)}{!fixed && <button type="button" onClick={()=>onChange([...value,structuredClone(template[0])])}>Add entry</button>}</fieldset>;
}
function HomeOrder({value,onChange}) {
  const [selected,setSelected]=useState("");
  return <><ol>{value.map((id,i)=><li key={id} className="workspace-actions"><strong>{label(id)}</strong>
    {[[-1,"Up"],[1,"Down"]].map(([n,title])=><button type="button" key={title} disabled={!value[i+n]} onClick={()=>{const a=[...value];[a[i],a[i+n]]=[a[i+n],a[i]];onChange(a);}}>{title}</button>)}
    <button type="button" disabled={value.length===1} onClick={()=>onChange(value.filter(x=>x!==id))}>Hide section</button></li>)}</ol>
    {value.length<siteDefaults["home-layout"].length&&<label>Show a section<select value={selected} onChange={e=>{if(e.target.value)onChange([...value,e.target.value]);setSelected("");}}><option value="">Choose section</option>{siteDefaults["home-layout"].filter(x=>!value.includes(x)).map(x=><option key={x} value={x}>{label(x)}</option>)}</select></label>}</>;
}
export default function WebsiteEditor({records,scheduling=true}) {
  const [saved,setSaved]=useState(records),[section,setSection]=useState("home"),[value,setValue]=useState(records.home?.content||siteDefaults.home);
  const [reviewed,setReviewed]=useState(false);
  const [when,setWhen]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[edits,setEdits]=useState({});
  function edit(next){setReviewed(false);setValue(next);setEdits({...edits,[section]:next});setMessage("");}
  function choose(key){setReviewed(false);setSection(key);setValue(edits[key]||saved[key]?.content||siteDefaults[key]);setMessage("");setWhen("");}
  async function submit(event){
    event.preventDefault(); const action=event.nativeEvent.submitter?.value||"save";
    setBusy(true); setMessage("");
    try{
      validateSection(section,value);
      const effective=action==="publish"&&when ? new Date(when).toISOString():null;
      const r=await fetch("/api/admin/website",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,section,reviewed,version:saved[section]?.version||0,content:value,effective_at:effective})});
      const result=await r.json();if(!r.ok)throw Error(result.error);
      const future=effective&&new Date(effective)>new Date();
      setSaved({...saved,[section]:{...saved[section],version:result.version,content:value,...(action==="publish"?{scheduled_at:future?effective:null,...(!future?{live_version:result.version}:{})}:{})}});
      setMessage(action==="save"?"Draft saved.":future?"Publication scheduled for "+new Date(effective).toLocaleString()+".":"Published on the website.");
    }catch(e){setMessage(e.message);}finally{setBusy(false);}
  }
  return <section className="workspace-card"><Link href="/admin/cms">Website CMS</Link><h2>Website pages & menus</h2>
    <label>Choose a page or section<select disabled={busy} value={section} onChange={e=>choose(e.target.value)}>{Object.keys(siteDefaults).map(k=><option key={k} value={k}>{sectionLabel(k)}</option>)}</select></label>
    <h3>{sectionLabel(section)}</h3><p>Draft revision {saved[section]?.version||0} · Live revision {saved[section]?.live_version||"original"}{saved[section]?.scheduled_at?" · Scheduled "+new Date(saved[section].scheduled_at).toLocaleString():""}</p>
    <form onSubmit={submit} className="site-editor-form"><fieldset disabled={busy}>{section==="home-layout"?<HomeOrder value={value} onChange={edit}/>:<Field key={section} name={section} value={value} template={siteDefaults[section]} fixed={section==="navigation"} onChange={edit}/>}</fieldset>
    {scheduling && <label>Publish at (optional, local time)<input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></label>}
    <label className="check"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>I have reviewed the text, media rights and privacy for publication.</label>
    <div className="workspace-actions"><button value="save" disabled={busy}>Save draft</button><button className="primary" value="publish" disabled={busy||!reviewed}>{when?"Schedule publication":"Publish now"}</button></div><p role="status" aria-live="polite">{message}</p></form></section>;
}
