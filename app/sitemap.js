import {siteConfig,pages} from '../lib/seo.mjs';
export default function sitemap(){const {origin,indexable}=siteConfig();return indexable?pages.map(p=>({url:new URL(p.path,origin).href})):[];}
