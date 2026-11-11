import {siteConfig} from '../lib/seo.mjs';
export default function robots(){const {origin,indexable}=siteConfig();return {rules:{userAgent:'*',...(indexable?{allow:'/',disallow:['/admin/','/account/','/api/','/data-room/','/auth/']}:{disallow:'/'})},...(indexable?{sitemap:origin+'/sitemap.xml'}:{})};}
