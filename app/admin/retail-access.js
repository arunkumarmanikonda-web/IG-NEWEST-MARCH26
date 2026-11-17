"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {portalAction} from "../account/profile";

export default function RetailAccess({record,clients,contacts,engagement,members}){
 const router=useRouter(),[busy,setBusy]=useState(false),[msg,setMsg]=useState(""),[client,setClient]=useState(engagement?.client_id || "");
 const [contact,setContact]=useState(""),[newPeople,setNewPeople]=useState([{name:"",email:""}]);
 const creating=client==="new";
 const saved=members.find(m=>m.contact_id===contact);
 const room=engagement?.ig_data_rooms?.id || engagement?.ig_data_rooms?.[0]?.id;
 async function submit(e){
   e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setMsg("");
   try {
     await portalAction("retail_mandate",{action:engagement?"contact":"assign",content_id:record.id,client_id:creating?null:client, new_client:creating?{name:f.get("organisation"),contacts:newPeople}:null,
       title:f.get("title"),terms:f.get("terms"),confirmed:f.get("confirmed")==="on",contact_id:contact,
       contact_ids:f.getAll("initial_contacts"), side:f.get("side"),mode:f.get("mode"),expires_at:f.get("expiry")?new Date(f.get("expiry")+"T23:59:59+05:30").toISOString():null});
     if(creating)setClient("");
     setMsg(engagement?"Contact access updated.":"Client assigned and private mandate room created.");router.refresh();
   }catch(e){setMsg(e.message);}finally{setBusy(false);}
 }
 const options=clients.filter(c=>c.stage!=="archived");
 return <section className="workspace-card" id="mandate-clients"><h2>Mandate client &amp; collaboration</h2>
 <p>{engagement?"Access is personal to each configured email. Contacts given room access can see its shared documents.":"Assign the promoter or brand you represent. The client collaboration room is separate from the internal AI source room."}</p>
 {engagement && <p><strong>{engagement.title}</strong> · {clients.find(c=>c.id===engagement.client_id)?.name} · <Link href={"/admin/data-rooms?room="+room+"#room-files"}>Manage shared files →</Link></p>}
 <form className="workspace-form" onSubmit={submit}>
 <label>{engagement?"Contact’s organisation":"Represented client"}<select required value={client} onChange={e=>{setClient(e.target.value);setContact("");}}><option value="">Select a client</option>{!engagement&&<option value="new">+ Create client in this mandate</option>}{options.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <Link href="/admin/clients">Create a client or add portal contacts →</Link>
 {!engagement?<><label>Private dashboard title<input required minLength={2} maxLength={180} name="title" defaultValue={record.title}/></label>
 {creating?<fieldset className="wide"><legend>New client &amp; dashboard contacts</legend><label>Organisation<input name="organisation" required minLength={2} maxLength={180}/></label>
 {newPeople.map((person,i)=><div className="workspace-form" key={i}>{["name","email"].map(k=><label key={k}>{k==="name"?"Contact name":"Dashboard email"}<input required maxLength={k==="name"?120:254} type={k==="email"?"email":"text"} value={person[k]} onChange={e=>setNewPeople(newPeople.map((v,j)=>j===i?{...v,[k]:e.target.value}:v))}/></label>)}{newPeople.length>1 && <button type="button" onClick={()=>setNewPeople(newPeople.filter((_,j)=>i!==j))}>Remove contact</button>}</div>)}
 <button type="button" disabled={newPeople.length>=50} onClick={()=>setNewPeople([...newPeople,{name:"",email:""}])}>Add another email</button><small>These contacts can see this mandate on their dashboard. Open their room access separately.</small></fieldset>:<fieldset className="wide"><legend>Client dashboard contacts</legend>{contacts.filter(c=>c.client_id===client && c.active && c.portal_enabled).map(c=><label className="check" key={c.id}><input name="initial_contacts" type="checkbox" value={c.id}/>{c.name} · {c.email}</label>)}{!contacts.some(c=>c.client_id===client && c.active && c.portal_enabled) && <p>Choose a client with an active portal contact, or add one in Global clients.</p>}<small>Selected contacts can see this mandate on their dashboard. You can open room access after assignment.</small></fieldset>}
 <label>Executed mandate / confidentiality reference<input required minLength={5} maxLength={500} name="terms"/></label>
 <label className="check"><input name="confirmed" type="checkbox" required/>Executed mandate and disclosure terms verified</label></>:<>
 <label>Named contact<select required value={contact} onChange={e=>setContact(e.target.value)}><option value="">Select an email address</option>{contacts.filter(c=>c.client_id===client && (c.active && c.portal_enabled || members.some(m=>m.contact_id===c.id))).map(c=><option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}</select></label>
 <label>Party<select key={contact+"side"} name="side" defaultValue={saved?.side || (record.kind==="retail_space"?"Promoter":"Brand")}><option>Promoter</option><option>Brand</option></select></label>
 <label>Permission<select key={contact+"mode"} name="mode" defaultValue={saved?.dashboard?(saved.ig_room_grants?.active?(saved.allow_upload?"upload":"view"):"dashboard"):saved?"off":"dashboard"}><option value="dashboard">Dashboard only</option><option value="view">Dashboard and view shared room</option><option value="upload">Dashboard, view and upload</option><option value="off">Remove access</option></select></label>
 <label>Room access until (India time)<input required type="date" name="expiry" key={contact+"date"} defaultValue={(saved?.ig_room_grants?.expires_at || new Date(Date.now()+90*86400000).toISOString()).slice(0,10)}/></label></>}
 <button disabled={busy} className="primary">{engagement?"Save contact access":"Assign client & create room"}</button></form>
 {members.some(m=>m.dashboard)&&<ul>{members.filter(m=>m.dashboard).map(m=><li key={m.contact_id}>{contacts.find(c=>c.id===m.contact_id)?.email} · {m.side} · {m.ig_room_grants?.active?(m.allow_upload?"View & upload":"View"):"Dashboard only"}{m.ig_room_grants?.active && ' · until '+m.ig_room_grants.expires_at.slice(0,10)}</li>)}</ul>}
 <p role="status">{msg}</p></section>;
}
