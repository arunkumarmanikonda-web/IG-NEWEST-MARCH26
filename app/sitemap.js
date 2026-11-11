import {siteConfig,pages} from '../lib/seo.mjs';
import {publishedIndex,contentPath} from '../lib/cms';
export const dynamic='force-dynamic';
export default async function sitemap(){const {origin,indexable}=siteConfig();if(!indexable)return [];const records=await publishedIndex();const baseline=records===null?pages:pages.filter(p=>!/^\/(opportunities|insights)\//.test(p.path));return [...baseline.map(p=>({url:new URL(p.path,origin).href})),...(records||[]).map(x=>({url:new URL(contentPath(x),origin).href,lastModified:x.published_at}))];}
