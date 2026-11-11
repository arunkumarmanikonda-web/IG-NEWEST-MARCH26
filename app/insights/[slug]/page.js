import Link from 'next/link';
import {notFound} from 'next/navigation';
import {insights} from '../../../lib/content.mjs';
import {PageHero,ContactBand} from '../../components';
export function generateStaticParams(){return insights.map(x=>({slug:x.slug}))}
export async function generateMetadata({params}){const {slug}=await params;const x=insights.find(x=>x.slug===slug);return {title:x?.title||'Perspective',description:x?.summary}}
export default async function Article({params}){const {slug}=await params;const x=insights.find(x=>x.slug===slug);if(!x)notFound();return <main id="main"><PageHero eyebrow={x.category} title={x.title} description={x.summary}/><div className="article-layout"><aside><Link href="/insights">All perspectives</Link><p>IN THIS PERSPECTIVE</p>{x.sections.map(([title],i)=><a href={'#section-'+i} key={title}>{title}</a>)}</aside><article className="article-body">{x.sections.map(([title,text],i)=><section key={title} id={'section-'+i}><h2>{title}</h2><p>{text}</p></section>)}<p className="fine-note">General process guidance. The appropriate scope and specialist advice depend on the particular asset, business and transaction.</p></article></div><ContactBand/></main>}
