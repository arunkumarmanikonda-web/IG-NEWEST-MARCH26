'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {portalAction} from '../account/profile';
import {practiceOptions} from '../../lib/business.mjs';
import {engagementServices,clientStages} from '../../lib/client-services.mjs';

export default function ClientsManager({clients,contacts,engagements,rooms,roomAdmin}) {
 const router=useRouter(),[selected,setSelected]=useState(clients[0]?.id||''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[search,setSearch]=useState('');
 const client=clients.find(c=>c.id===selected);
 async function save(payload){setBusy(true);setMessage('');try{const result=await portalAction('clients',payload);if(payload.action==='client_save')setSelected(result.id);setMessage('Saved. Access and changes are recorded in the audit trail.');router.refresh();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 function clientForm(record){return <form className="workspace-form" key={record?.id+'-'+record?.version} onSubmit={event=>{event.preventDefault();const f=new FormData(event.currentTarget);save({action:'client_save',id:record?.id,version:record?.version,name:f.get('name'),practice:record?.practice||f.get('practice'),stage:f.get('stage'),reference:f.get('reference'),notes:f.get('notes')});}}>
  <label>Client / organisation name<input name="name" required minLength={2} maxLength={180} defaultValue={record?.name}/></label>
  <label>Responsible practice<select name="practice" defaultValue={record?.practice||'transaction-advisory'} disabled={!!record}>{practiceOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label>Sales stage<select name="stage" defaultValue={record?.stage||'prospect'}>{clientStages.map(s=><option key={s}>{s}</option>)}</select></label>
  <label>Client reference<input name="reference" maxLength={100} defaultValue={record?.reference}/></label>
  <label className="wide">Internal relationship notes<textarea name="notes" maxLength={5000} rows={3} defaultValue={record?.notes}/></label>
  <button disabled={busy}>{record?'Save client':'Create client'}</button>
 </form>;}
 function contactForm(record){return <form key={record?.id+'-'+record?.version} className="workspace-form" onSubmit={event=>{event.preventDefault();const f=new FormData(event.currentTarget);save({action:'contact_save',client_id:client.id,id:record?.id,version:record?.version,name:f.get('name'),email:f.get('email'),designation:f.get('designation'),active:!record||f.get('active')==='on',portal_enabled:f.get('portal')==='on',circulation:f.get('circulation')==='on'});}}>
  <label>Contact name<input name="name" required maxLength={120} defaultValue={record?.name}/></label>
  <label>Email address<input name="email" type="email" required maxLength={254} defaultValue={record?.email}/></label>
  <label>Designation / relationship<input name="designation" maxLength={120} defaultValue={record?.designation}/></label>
  {record&&<label className="check"><input type="checkbox" name="active" defaultChecked={record.active}/>Contact active</label>}
  <label className="check"><input type="checkbox" name="portal" defaultChecked={record?.portal_enabled}/>Allow this email to register for the client portal</label>
  <label className="check"><input type="checkbox" name="circulation" defaultChecked={record?.circulation}/>Include in authorised report circulation</label>
  <button disabled={busy}>{record?'Save contact':'Add contact'}</button>
 </form>;}
 function engagementForm(record){const room=rooms.find(r=>r.engagement_id===record?.id);return <form className="workspace-form" key={record?.id+'-'+record?.version} onSubmit={event=>{event.preventDefault();const f=new FormData(event.currentTarget);save({action:'engagement_save',client_id:client.id,id:record?.id,version:record?.version,title:f.get('title'),service:f.get('service'),reference:f.get('reference'),confidentiality_reference:f.get('confidentiality_reference'),confidentiality_confirmed:f.get('confirmed')==='on',active:!record||f.get('active')==='on'});}}>
  <label>Engagement / report title<input name="title" minLength={2} maxLength={180} required defaultValue={record?.title}/></label>
  <label>Service<select name="service" defaultValue={record?.service||'feasibility'}>{engagementServices.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
  <label>Engagement reference<input name="reference" required minLength={2} maxLength={120} defaultValue={record?.reference}/></label>
  <label>Executed engagement / confidentiality agreement reference<input name="confidentiality_reference" maxLength={500} defaultValue={record?.confidentiality_reference}/></label>
  <label className="check wide"><input type="checkbox" name="confirmed" defaultChecked={record?.confidentiality_confirmed}/>I have verified the executed engagement and confidentiality terms authorising disclosure to this client's approved contacts.</label>
  {record&&<label className="check"><input type="checkbox" name="active" defaultChecked={record.active}/>Engagement access active</label>}
  <button disabled={busy}>{record?'Save engagement':'Create engagement & private room'}</button>
  {room&&<Link href={'/admin/data-rooms?room='+room.id}>Manage reports & access →</Link>}
 </form>;}
 return <section className="workspace-card"><div className="eyebrow">RELATIONSHIPS / DELIVERY</div><h2>Clients & engagements</h2>
  <p>Create a client, add its named contacts and open a private engagement for each assignment. Sales records stay internal. Administrators control report access separately from circulation preferences.</p>
  <p role="status" aria-live="polite">{message}</p>
  <details className="enquiry-record"><summary>Create a client</summary>{clientForm()}</details>
  <div className="workspace-form"><label>Find a client<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Client name or reference"/></label>
  <label>Manage client<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a client</option>{clients.filter(c=>[c.name,c.reference].some(v=>v.toLowerCase().includes(search.toLowerCase()))).map(c=><option key={c.id} value={c.id}>{c.name} · {c.stage}</option>)}</select></label></div>
  {client&&<><h3>{client.name}</h3><details className="enquiry-record"><summary>Client details & sales stage</summary>{clientForm(client)}</details>
   <h3>Contacts & circulation</h3><p>Each email signs in independently. Enabling portal registration does not grant access to reports. No contact receives another contact's email address in circulation notices. Disabling a contact removes its access immediately on the next permission check.</p>
   {contacts.filter(c=>c.client_id===client.id).map(c=><details className="enquiry-record" key={c.id}><summary>{c.name} · {c.email} · {c.active?'Active':'Disabled'}</summary>{contactForm(c)}</details>)}
   <details className="enquiry-record"><summary>Add a client contact</summary>{contactForm()}</details>
   <h3>Assignments & report rooms</h3><p>Feasibility, valuation, forensic and operational audit reports are shared through a private room for the relevant engagement. An opportunity data room continues to require its project-specific NDA.</p>
   {roomAdmin?<>{engagements.filter(e=>e.client_id===client.id).map(e=><details className="enquiry-record" key={e.id}><summary>{e.title} · {e.reference} · {e.active?'Active':'Paused'}</summary>{engagementForm(e)}</details>)}<details className="enquiry-record"><summary>Create an engagement</summary>{engagementForm()}</details></>:<p>A practice administrator must create engagements and approve report access.</p>}
  </>}
  {!clients.length&&<p className="workspace-note">No clients yet. Start with Create a client.</p>}
 </section>;
}
