"use client";
import {useState} from "react";
import {browserClient} from "../../lib/supabase/browser";
import {planTypes,retailFields,unitFields,unitStatuses} from "../../lib/retail-mandates.mjs";

export default function RetailFields({kind,record,data,sources,dirty}) {
  const [units,setUnits]=useState((data.units||[]).map(u=>({...u,key:crypto.randomUUID()})));
  const [plans,setPlans]=useState(data.plans || []), [label,setLabel]=useState(""), [type,setType]=useState(planTypes[0]);
  const [file,setFile]=useState(null),[source,setSource]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  function update(list){setUnits(list);dirty();}
  async function attach(){
    setBusy(true);setMessage("");
    try{
      let blob=file, name=file?.name;
      if(source){
        const selected=sources.find(s=>s.id===source);
        const response=await fetch("/api/data-room/file?id="+encodeURIComponent(source)+"&mode=download");
        if(!response.ok) throw Error("The source could not be opened.");
        blob=await response.blob();name=selected.name;
      }
      const ext=name?.split(".").at(-1)?.toLowerCase().replace(/^jpeg$/,"jpg");
      const mime={pdf:"application/pdf",jpg:"image/jpeg",png:"image/png",webp:"image/webp"}[ext];
      if(!blob || !mime || blob.size>31457280 || !blob.size) throw Error("Choose a PDF, JPEG, PNG or WebP up to 30 MB.");
      const bytes=new Uint8Array(await blob.slice(0,12).arrayBuffer());
      const head=String.fromCharCode(...bytes);
      if(!(ext==="pdf" && head.startsWith("%PDF-") || ext==="png" && head.startsWith("\x89PNG\r\n\x1a\n") || ext==="jpg" && bytes[0]===255 && bytes[1]===216 && bytes[2]===255 || ext==="webp" && head.startsWith("RIFF") && head.endsWith("WEBP"))) throw Error("This file does not match its declared format.");
      const path=record.id+"/"+crypto.randomUUID()+"."+ext;
      const {error}=await browserClient().storage.from("ig-retail-plans").upload(path,blob,{contentType:mime,upsert:false});
      if(error)throw Error("The approved copy could not be uploaded. Check your practice access.");
      setPlans(prev=>[...prev,{path,label:label.trim(),type}]);setLabel("");setSource("");setFile(null);dirty();setMessage("Plan attached. Save and publish this revision to make it visible.");
    } catch(e){setMessage(e.message);} finally{setBusy(false);}
  }
  return <>
    {Object.entries(retailFields[kind]).filter(([k])=>k!=="price_label").map(([k,l])=><label key={k}>{l}<input name={k} maxLength={500} defaultValue={data[k]||""}/></label>)}
    {kind==="retail_space" && <div className="wide">
      <h3>Unit availability</h3>
      <input type="hidden" name="units" value={JSON.stringify(units.map(({key,...row})=>row))}/>
      {units.map((u,i)=><fieldset className="workspace-form" key={u.key}><legend>Unit {i+1}</legend>
        {Object.entries(unitFields).map(([field,title])=><label key={field}>{title}{field==="status"?<select value={u.status} onChange={e=>update(units.map((v,j)=>j===i?{...v,status:e.target.value}:v))}>{unitStatuses.map(x=><option key={x}>{x}</option>)}</select>:<input required={field==="unit"} maxLength={160} value={u[field]} onChange={e=>update(units.map((v,j)=>j===i?{...v,[field]:e.target.value}:v))}/>}</label>)}
        <button type="button" onClick={()=>update(units.filter((_,j)=>j!==i))}>Remove unit</button></fieldset>)}
      <button type="button" onClick={()=>update([...units,{key:crypto.randomUUID(),unit:"",floor:"",area:"",basis:"",zone:"",status:"To confirm"}])}>Add unit</button>
      <h3>Public plans and drawings</h3><p>Select only a copy cleared for public viewing. The private source room stays separate.</p>
      <input type="hidden" name="plans" value={JSON.stringify(plans)}/>
      {plans.map(p=><p key={p.path}>{p.type} · {p.label} <button type="button" onClick={()=>{setPlans(plans.filter(x=>x.path!==p.path));dirty();}}>Remove from revision</button></p>)}
      {record?<fieldset className="workspace-form" disabled={busy}><legend>Attach a cleared copy</legend>
        <label>Public label<input value={label} maxLength={120} onChange={e=>setLabel(e.target.value)} placeholder="Ground floor, east wing"/></label>
        <label>Document type<select value={type} onChange={e=>setType(e.target.value)}>{planTypes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Choose an uploaded source<select value={source} onChange={e=>setSource(e.target.value)}><option value="">Choose a file below</option>{sources.filter(x=>x.status==="ready" && /\.(pdf|png|jpe?g|webp)$/i.test(x.name) && x.bytes<=31457280).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        {!source && <label>Upload approved copy<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e=>setFile(e.target.files[0])}/></label>}
        <button type="button" disabled={!label.trim() || !(source || file) || plans.length>=40} onClick={attach}>Approve and attach to draft</button></fieldset>:<p>Save the draft to attach a public plan.</p>}
      <p role="status">{message}</p>
    </div>}
  </>;
}
