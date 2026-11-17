"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {FILE_ACCEPT,roomFileType} from "../../../../lib/data-room-formats.mjs";
import {resumableSourceUpload} from "../../../../lib/intake-upload.mjs";
export default function ClientUpload({roomId}){
 const router=useRouter(),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),pending=useRef(new Map());
 async function submit(e){
  e.preventDefault();const form=e.currentTarget, files=[...form.elements.files.files];setBusy(true);
  async function action(p){const r=await fetch("/api/data-room/upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});const j=await r.json();if(!r.ok)throw Error(j.error || "Upload failed");return j;}
  try{
   for(const file of files){
    const mime=roomFileType(file.name)?.mime;if(!mime)throw Error("Choose a supported document or image.");
    const key=[file.name,file.size,file.lastModified].join("|");let job=pending.current.get(key);
    if(!job){job=await action({action:"prepare",name:file.name,room_id:roomId,bytes:file.size,mime});pending.current.set(key,job);}
    if(job.done)continue;
    if(!job.uploaded){await resumableSourceUpload({file,upload:job,source:{id:job.id,sha256:key},projectUrl:process.env.NEXT_PUBLIC_SUPABASE_URL,bucket:"ig-data-rooms",contentType:mime,onProgress:p=>setMsg(file.name+" · "+p+"%")});job.uploaded=true;}
    await action({action:"complete",id:job.id,version:job.version});job.done=true;
   }
   form.reset();pending.current.clear();setMsg("Files added to the shared mandate room.");router.refresh();
  }catch(error){setMsg(error.message);}finally{setBusy(false);}
 }
 return <form className="workspace-card" onSubmit={submit}><h2>Contribute documents</h2><p>Files you add are visible to authorised participants in this room.</p><input aria-label="Documents to share" required name="files" type="file" accept={FILE_ACCEPT} multiple disabled={busy}/><button disabled={busy}>Upload selected files</button><p role="status">{msg}</p></form>;
}
