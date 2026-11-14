"use client";
import {useState} from "react";
import {browserClient} from "../../lib/supabase/browser";
import {readRegister} from "../../lib/registers.mjs";

export default function ModelPhotoPicker({getProduct,onChoose}) {
  const [rows,setRows]=useState([]), [query,setQuery]=useState(""), [notice,setNotice]=useState(""), [busy,setBusy]=useState(false);
  async function findPhotos() {
    const brand=getProduct().brand?.trim();
    if (!brand) {setRows([]);setNotice("Enter the manufacturer in the product’s Brand field first.");return;}
    setBusy(true);setRows([]);setNotice("");
    try {
      const client=browserClient();
      const {data,error}=await readRegister(()=>client.from("ig_public_content")
        .select("id,title,public_data").eq("kind","product")
        .ilike("public_data->>brand",brand.replace(/[\\%_]/g, char=>"\\"+char))
        .not("public_data->>image","is",null).neq("public_data->>image",""));
      if (error) throw error;
      const photos=data.filter(row=>!row.public_data.image.startsWith("/images/generated/"));
      setRows(photos);
      setNotice(photos.length ? "Select the model and finish that match this SKU." : "No approved catalogue photos were found for "+brand+".");
    } catch {setNotice("The approved photos could not be loaded. Try again.");}
    finally {setBusy(false);}
  }
  const words=query.trim().toLowerCase();
  const matches=rows.filter(({title,public_data:d})=>[title,d.sku,d.reference].join(" ").toLowerCase().includes(words));
  const seen=new Set();
  const photos=matches.filter(({public_data:d})=>!seen.has(d.image)&&seen.add(d.image));
  return <details className="model-photo-picker"><summary>Use an approved photo from the same model</summary>
    <p>Wattage and size variants can share a photograph. Match the housing, finish and mounting style.</p>
    <button type="button" disabled={busy} onClick={findPhotos}>{busy?"Loading photos…":"Find photos for this brand"}</button>
    <p role="status">{notice}</p>
    {rows.length>0&&<><label>Find a model or SKU<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
      {!photos.length&&<p>No matching model found.</p>}
      <div className="model-photo-options">{photos.map(({id,title,public_data:d})=><button type="button" key={id} onClick={()=>{
        onChoose(d.image,"Manufacturer model photograph · "+getProduct().title);
        setNotice("Model photo selected. Save the draft to keep it.");
      }}><img src={d.image} alt="" loading="lazy"/><strong>{title}</strong><small>{d.sku}</small></button>)}</div></>}
  </details>;
}
