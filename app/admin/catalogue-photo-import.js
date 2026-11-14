"use client";
import {useState} from "react";
import {prepareMediaUpload} from "../../lib/media-upload.mjs";

export default function CataloguePhotoImport() {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function importPhotos(e) {
    e.preventDefault();
    const form=new FormData(e.currentTarget),files=form.getAll("photos"),issues=[];
    let saved=0;
    setBusy(true);
    try{
      for(const [index,file] of files.entries()){
        setMessage("Matching photograph "+(index+1)+" of "+files.length+"…");
        try{
          const response=await fetch("/api/admin/source-media",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({catalogue_match:true,source_name:file.name,brand:form.get("brand"),rights_reference:form.get("source"),
              rights_confirmed:true,preset:"square",data:await prepareMediaUpload(file,"square")})});
          const result=await response.json();
          if(!response.ok)throw Error(result.error);
          saved++;
        }catch(error){issues.push(file.name+" · "+error.message);}
      }
      setMessage(saved+" of "+files.length+" photographs matched to products for private review."+ (issues.length?"\n"+issues.join("\n"):""));
    }finally{setBusy(false);}
  }
  return <details className="workspace-card"><summary>Match product photographs by manufacturer code</summary>
    <form className="workspace-form" onSubmit={importPhotos}><label>Catalogue brand<input name="brand" required minLength={2} maxLength={100}/></label>
    <label>Photographs named by manufacturer code<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required/></label>
    <label>Source or supplier reference<input name="source" required minLength={5} maxLength={350}/></label>
    <label className="check"><input type="checkbox" required/>I am authorised to store these product photographs for private editorial review.</label>
    <button disabled={busy}>Match photographs to product drafts</button></form><p role="status" className="preserve-lines">{message}</p></details>;
}
