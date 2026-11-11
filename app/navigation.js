'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {Arrow} from './components';
const links=[['/practices','Our practices'],['/opportunities','Opportunities'],['/projects','Projects'],['/horeca','HORECA'],['/insights','Perspectives'],['/about','About us']];
export default function Navigation(){const path=usePathname();const [open,setOpen]=useState(false);return <header className="site-header"><Link href="/" className="brand" aria-label="India Gully home" onClick={()=>setOpen(false)}><img src="/logo-dark.png" alt="India Gully. Celebrating Desiness." width="224" height="52"/></Link><button className="menu-toggle" aria-expanded={open} aria-controls="primary-navigation" onClick={()=>setOpen(!open)}>{open?'Close':'Menu'}<span aria-hidden="true">{open?'×':'+'}</span></button><nav id="primary-navigation" className={open?'site-nav is-open':'site-nav'} aria-label="Primary">{links.map(([href,title])=><Link href={href} key={href} aria-current={path===href||path.startsWith(href+'/')?'page':undefined} onClick={()=>setOpen(false)}>{title}</Link>)}<Link href="/contact" className="nav-contact" onClick={()=>setOpen(false)}>Let’s talk <Arrow/></Link></nav></header>}
