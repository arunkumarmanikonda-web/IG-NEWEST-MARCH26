'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {portalAction} from '../account/profile';
import {practiceOptions} from '../../lib/business.mjs';
import {engagementServices,clientStages,prepareContactRows} from '../../lib/client-services.mjs';

const emptyContact = () => ({name:'',email:'',phone:'',designation:'',portal_enabled:false,circulation:false});
function ContactRows({rows,setRows,busy}) {
 function update(index,key,value){setRows(rows.map((row,i)=>i===index?{...row,[key]:value}:row));}
 return <div className="wide client-contact-batch">
  {rows.map((row,index)=><fieldset key={row.key} className="client-contact-card" disabled={busy}>
   <legend>Contact {index+1}</legend>
   <div className="workspace-form">
    <label>Contact name<input value={row.name} onChange={e=>update(index,'name',e.target.value)} maxLength={120}/></label>
    <label>Email address<input type="email" value={row.email} onChange={e=>update(index,'email',e.target.value)} maxLength={254}/></label>
    <label>Contact number<input type="tel" autoComplete="tel" placeholder="Include country code, e.g. +91" value={row.phone} onChange={e=>update(index,'phone',e.target.value)} maxLength={40}/></label>
    <label>Designation / relationship<input value={row.designation} onChange={e=>update(index,'designation',e.target.value)} maxLength={120}/></label>
    <label className="check"><input type="checkbox" checked={row.portal_enabled} onChange={e=>update(index,'portal_enabled',e.target.checked)}/>Allow client portal registration</label>
    <label className="check"><input type="checkbox" checked={row.circulation} onChange={e=>update(index,'circulation',e.target.checked)}/>Include in authorised report circulation</label>
   </div>
   {rows.length>1&&<button className="quiet-button" type="button" onClick={()=>setRows(rows.filter((_,i)=>i!==index))}>Remove contact {index+1}</button>}
  </fieldset>)}
  <button className="button secondary" type="button" disabled={busy||rows.length>=50} onClick={()=>setRows([...rows,{...emptyContact(),key:crypto.randomUUID()}])}>+ Add another contact</button>
 </div>;
}
function ClientForm({record,busy,onSave}) {
 const [rows,setRows]=useState([{...emptyContact(),key:'initial'}]);
 return <form className="workspace-form" aria-label={record?'Edit client':'Create client'} onSubmit={async event=>{
  event.preventDefault();const form=event.currentTarget,f=new FormData(form);
  const result=await onSave({action:'client_save',id:record?.id,version:record?.version,name:f.get('name'),practice:record?.practice||f.get('practice'),stage:f.get('stage'),reference:f.get('reference'),notes:f.get('notes'),...(!record?{contacts:rows}: {})});
  if(result&&!record){form.reset();setRows([{...emptyContact(),key:crypto.randomUUID()}]);}
 }}>
  <label>Client / organisation name<input name="name" required minLength={2} maxLength={180} defaultValue={record?.name}/></label>
  <label>Responsible practice<select name="practice" defaultValue={record?.practice||'transaction-advisory'} disabled={!!record}>{practiceOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label>Sales stage<select name="stage" defaultValue={record?.stage||'prospect'}>{clientStages.map(s=><option key={s}>{s}</option>)}</select></label>
  <label>Client reference<input name="reference" maxLength={100} defaultValue={record?.reference}/></label>
  <label className="wide">Internal relationship notes<textarea name="notes" maxLength={5000} rows={3} defaultValue={record?.notes}/></label>
  {!record&&<><div className="wide"><h3>Client contacts</h3><p>Add the people you work with at this organisation. Each contact has their own email and telephone number. You can add more contacts now or later.</p></div><ContactRows rows={rows} setRows={setRows} busy={busy}/></>}
  <button disabled={busy}>{busy?'Saving…':record?'Save client':'Create client & contacts'}</button>
 </form>;
}
function AddContacts({client,busy,onSave}) {
 const [rows,setRows]=useState([{...emptyContact(),key:'initial'}]);
 return <form aria-label="Add client contacts" className="workspace-form" onSubmit={async event=>{event.preventDefault();const result=await onSave({action:'contacts_add',client_id:client.id,contacts:rows});if(result)setRows([{...emptyContact(),key:crypto.randomUUID()}]);}}>
  <ContactRows rows={rows} setRows={setRows} busy={busy}/><button disabled={busy}>{busy?'Saving…':'Save new contacts'}</button>
 </form>;
}

export default function ClientsManager({clients,contacts,engagements,rooms,roomAdmin}) {
 const router=useRouter(),[selected,setSelected]=useState(clients[0]?.id||''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[search,setSearch]=useState('');
 const client=clients.find(c=>c.id===selected);
 async function save(payload){setBusy(true);setMessage('');try{
  if(payload.contacts)payload={...payload,contacts:prepareContactRows(payload.contacts)};
  if(payload.action==='contacts_add'&&!payload.contacts.length)throw new Error('Enter at least one contact name and email address.');
  const result=await portalAction('clients',payload);
  if(payload.action==='client_save'){setSelected(result.id);setSearch('');}
  setMessage(payload.action==='contacts_add'?`${result.added} contact${result.added===1?'':'s'} saved to ${client.name}. Add another contact below at any time.`:payload.action==='contact_save'?'Contact updated.':payload.action==='engagement_save'?'Engagement saved. Report access is managed separately.':'Client saved. All supplied contacts are listed below.');
  router.refresh();return result;
 }catch(e){setMessage(e.message);return null;}finally{setBusy(false);}}
 function contactForm(record){return <form key={record?.id+'-'+record?.version} className="workspace-form" onSubmit={event=>{event.preventDefault();const f=new FormData(event.currentTarget);save({action:'contact_save',client_id:client.id,id:record?.id,version:record?.version,name:f.get('name'),email:f.get('email'),phone:f.get('phone'),designation:f.get('designation'),active:!record||f.get('active')==='on',portal_enabled:f.get('portal')==='on',circulation:f.get('circulation')==='on'});}}>
  <label>Contact name<input name="name" required maxLength={120} defaultValue={record?.name}/></label>
  <label>Email address<input name="email" type="email" required maxLength={254} defaultValue={record?.email}/></label>
  <label>Contact number<input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Include country code, e.g. +91" defaultValue={record?.phone}/></label>
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
  <p className="client-save-status" role="status" aria-live="polite">{message}</p>
  <details className="enquiry-record" open={!clients.length}><summary>Create a client with multiple contacts</summary><ClientForm busy={busy} onSave={save}/></details>
  <div className="workspace-form"><label>Find a client<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Organisation, contact name, email or phone"/></label>
  <label>Manage client<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a client</option>{clients.filter(c=>[c.name,c.reference,...contacts.filter(t=>t.client_id===c.id).flatMap(t=>[t.name,t.email,t.phone])].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))).map(c=><option key={c.id} value={c.id}>{c.name} · {c.stage}</option>)}</select></label></div>
  {client&&<><h3>{client.name}</h3><details className="enquiry-record"><summary>Client details & sales stage</summary><ClientForm key={client.id+'-'+client.version} record={client} busy={busy} onSave={save}/></details>
   <h3>Contacts & circulation <span className="client-contact-count">{contacts.filter(c=>c.client_id===client.id).length} contacts</span></h3><p>Each email signs in independently. Enabling portal registration does not grant access to reports. No contact receives another contact's email address in circulation notices. Disabling a contact removes its access immediately on the next permission check.</p>
   {contacts.filter(c=>c.client_id===client.id).map(c=><details className="enquiry-record" key={c.id}><summary><strong>{c.name}</strong><span className="client-contact-summary">{c.designation?c.designation+' · ':''}{c.email}{c.phone?' · '+c.phone:''} · {c.active?'Active':'Disabled'}</span></summary>{contactForm(c)}</details>)}
   <section className="client-add-contacts"><h4>Add contacts to {client.name}</h4><p>Save several people together. Adding contacts does not send an email or grant access to reports.</p><AddContacts key={client.id} client={client} busy={busy} onSave={save}/></section>
   <h3>Assignments & report rooms</h3><p>Feasibility, valuation, forensic and operational audit reports are shared through a private room for the relevant engagement. An opportunity data room continues to require its project-specific NDA.</p>
   {roomAdmin?<>{engagements.filter(e=>e.client_id===client.id).map(e=><details className="enquiry-record" key={e.id}><summary>{e.title} · {e.reference} · {e.active?'Active':'Paused'}</summary>{engagementForm(e)}</details>)}<details className="enquiry-record"><summary>Create an engagement</summary>{engagementForm()}</details></>:<p>A practice administrator must create engagements and approve report access.</p>}
  </>}
  {!clients.length&&<p className="workspace-note">No clients yet. Start with Create a client.</p>}
 </section>;
}
