'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {practiceOptions} from '../../lib/business.mjs';
import {portalAction} from '../account/profile';
const kinds=[['property','Real-estate opportunity'],['product','HORECA product'],['article','Insight / article'],['page','General page'],['campaign','Campaign draft']];
export default function AIManager({jobs}){
 const router=useRouter(),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function generate(event){event.preventDefault();setBusy(true);setMessage('');const f=new FormData(event.currentTarget);try{
  const r=await fetch('/api/admin/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({practice:f.get('practice'),kind:f.get('kind'),brief:f.get('brief'),facts:f.get('facts'),sources:f.get('sources'),publicOnly:f.get('publicOnly')==='on'})}),data=await r.json();if(!r.ok)throw new Error(data.error);
  setMessage('Draft prepared. Review its facts, source references and suggested search copy before saving.');router.refresh();
 }catch(e){setMessage(e.message);router.refresh();}finally{setBusy(false);}}
 async function save(event,job){event.preventDefault();setBusy(true);setMessage('');const f=new FormData(event.currentTarget);try{const result=await portalAction('ai_save',{id:job.id,slug:f.get('slug'),reviewed:f.get('reviewed')==='on'});router.push('/admin/content/'+result.id);}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return <section className="workspace-card"><div className="eyebrow">EDITORIAL / SEARCH / CREATIVE DIRECTION</div><h2>AI drafting studio</h2>
 <p>Prepare listing copy, HORECA descriptions, articles, search titles, keyword ideas, ad-copy drafts and creative briefs from facts approved for public use. The studio has no access to client reports, data rooms, mailboxes or customer records.</p>
 <p><Link href="/admin/settings">Super-user provider settings</Link> control the OpenAI key, model, token limit and daily request cap. Generation requires a funded API account. Drafts do not publish content, activate ads or generate property photographs.</p>
 <form className="workspace-form" onSubmit={generate}><label>Practice<select name="practice">{practiceOptions.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>Draft type<select name="kind">{kinds.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
 <label className="wide">Editorial brief<textarea name="brief" minLength={10} maxLength={6000} rows={3} required placeholder="Audience, objective, tone and required outcome"/></label>
 <label className="wide">Verified public facts · one per line<textarea name="facts" maxLength={12000} rows={7} required placeholder="Use only approved facts. Do not paste client reports or confidential project details."/></label>
 <label className="wide">Source references for these facts<textarea name="sources" minLength={10} maxLength={3000} rows={3} required placeholder="Public URL, approved specification or reviewed source document reference"/></label>
 <label className="check wide"><input name="publicOnly" type="checkbox" required/>I have checked these facts and have authority to submit this material to OpenAI for public-content drafting.</label><button disabled={busy}>{busy?'Preparing…':'Generate editorial draft'}</button></form>
 <p role="status" aria-live="polite">{message}</p><h3>Recent drafts</h3>
 {!jobs.length&&<p>No AI drafts yet. Your source-based drafts will appear here.</p>}
 {jobs.map(job=><details key={job.id} className="enquiry-record"><summary>{job.draft?.title||'Draft request'} · {job.status} · {new Date(job.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</summary>
  {job.status==='processing'&&<p>The request is processing. Refresh to check its recorded result.</p>}{job.status==='failed'&&<p>The provider did not return a complete, validated draft. No content was published. Check provider settings and retry with a new request.</p>}
  {job.draft&&<><h3>{job.draft.title}</h3><p>{job.draft.summary}</p><div className="draft-preview">{job.draft.body.split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</div>
   <h4>Search presentation</h4><p><strong>{job.draft.seo_title}</strong><br/>{job.draft.seo_description}</p><p>Keyword ideas: {job.draft.keywords.join(', ')}</p>
   <h4>Ad-copy drafts</h4><ul>{job.draft.ad_headlines.map((s,i)=><li key={i}>{s}</li>)}</ul>{job.draft.ad_descriptions.map((s,i)=><p key={i}>{s}</p>)}
   <h4>Creative direction</h4><p>{job.draft.creative_brief}</p><h4>Source-linked claims</h4><ul>{job.draft.claims.map((c,i)=><li key={i}>{c.text} ({c.factIds.join(', ')})</li>)}</ul><details><summary>Submitted facts & sources</summary><p>{job.context.sources}</p>{job.context.facts?.map(f=><p key={f.id}><strong>{f.id}:</strong> {f.value}</p>)}</details>
   <h4>Review before use</h4><ul>{job.draft.review_questions.map((s,i)=><li key={i}>{s}</li>)}</ul><p className="workspace-note">Source references do not prove every sentence is accurate. Review factual claims, disclosure, rights and commercial terms. Keyword ideas are not search-volume research or advertising approval.</p>
   {job.status==='ready'&&<form className="workspace-form" onSubmit={e=>save(e,job)}><label>Draft URL slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} required/></label><label className="check"><input name="reviewed" type="checkbox" required/>I have reviewed the output and want to save it as an unpublished CMS draft.</label><button disabled={busy}>Save as CMS draft</button></form>}
   {job.content_id&&<Link href={'/admin/content/'+job.content_id}>Open saved CMS draft →</Link>}
  </>}
 </details>)}
 </section>;
}
