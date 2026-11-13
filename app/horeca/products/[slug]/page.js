import {notFound} from 'next/navigation';
import {published,cmsMetadata} from '../../../../lib/cms';
import PublishedContent from '../../../published-content';
export const dynamic='force-dynamic';
async function lookup(params){const{slug}=await params;return (await published('product'))?.find(x=>x.slug===slug);}
export async function generateMetadata({params}){return cmsMetadata(await lookup(params));}
export default async function ProductPage({params}){const item=await lookup(params);if(!item)notFound();return <PublishedContent item={item}/>;}
