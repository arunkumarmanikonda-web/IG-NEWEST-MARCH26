'use client';
import Link from 'next/link';import BrandLogo from '../brand-logo';import {usePathname} from 'next/navigation';import {useState,useEffect} from 'react';
const groups=[['WORKSPACE',[['','Overview'],['clients','Global clients'],['enquiries','Enquiries & leads'],['mailbox','My business mailbox'],['campaigns','Marketing & campaigns']]],['PUBLISHING',[['cms','Website CMS'],['listings','Real estate listings'],['catalogue','HORECA catalogue'],['projects','Project showcases'],['intake','AI creation studio'],['creative','Creative library'],['taxonomy','Categories & tags']]],['PRACTICE OPERATIONS',[['horeca','HORECA procurement'],['procurement','Customer & supplier portal'],['pmc','PMC delivery'],['practice/real-estate','Real estate advisory'],['practice/transaction-advisory','Transactions & studies'],['practice/debt-special-situations','Debt & special situations'],['practice/hospitality','Hospitality advisory'],['practice/retail-leasing','Retail & leasing'],['practice/entertainment','Entertainment']]],['CLIENT DELIVERY',[['data-rooms','Project data rooms'],['nda','NDAs & access'],['payments','Invoices & payments']]],['GOVERNANCE',[['users','Users & permissions'],['settings','Integrations & legal'],['privacy','Privacy & grievances'],['audit','Audit trail']]]];
export default function AdminNavigation(){
 const pathname=usePathname();const[open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[pathname]);
 return <nav className="workspace-nav" aria-label="Staff workspace" onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
  <div className="nav-brand"><Link href="/admin" aria-label="India Gully management home"><BrandLogo light/></Link><small>MANAGEMENT SUITE</small><button type="button" className="workspace-menu-toggle" aria-expanded={open} aria-controls="workspace-sections" onClick={()=>setOpen(!open)}>{open?'Close menu':'Workspace menu'}</button></div>
  <div className="nav-sections" id="workspace-sections" data-open={open}>
   {groups.map(([title,links])=><div className="nav-group" key={title}><p>{title}</p>{links.map(([path,label])=>{const href='/admin'+(path?'/'+path:'');const active=path?pathname===href||pathname.startsWith(href+'/'):pathname===href;return <Link key={path} href={href} aria-current={active?'page':undefined}>{label}{active&&<span aria-hidden="true">●</span>}</Link>;})}</div>)}
   <div className="nav-foot">PRIVATE WORKSPACE<small>Practice permissions apply</small></div>
  </div>
 </nav>;
}
