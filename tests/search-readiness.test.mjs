import test from 'node:test';
import assert from 'node:assert/strict';
import {siteConfig,pageMeta,pages,structuredData,jsonLd} from '../lib/seo.mjs';
import {publicOpportunity} from '../lib/public-opportunities.mjs';
import {campaignDrafts,validateCampaignDraft} from '../lib/search-marketing.mjs';

const live={SEARCH_INDEXING_ENABLED:'true',NEXT_PUBLIC_SITE_URL:'https://www.indiagully.com',VERCEL_ENV:'production'};
test('indexing needs both the explicit launch switch and an approved live host',()=>{
 assert.equal(siteConfig({}).indexable,false);
 assert.equal(siteConfig(live).indexable,true);
 for(const env of [{...live,VERCEL_ENV:'preview'},{...live,SEARCH_INDEXING_ENABLED:'false'},{...live,NEXT_PUBLIC_SITE_URL:'https://india-gully.vercel.app'},{...live,NEXT_PUBLIC_SITE_URL:'https://indiagully.com.example.com'}])assert.equal(siteConfig(env).indexable,false);
 for(const value of ['http://indiagully.com','https://user:pass@indiagully.com','https://indiagully.com/?x=1','bad'])assert.throws(()=>siteConfig({NEXT_PUBLIC_SITE_URL:value}));
});
test('each public page has a distinct clean canonical and social metadata',()=>{
 assert.equal(new Set(pages.map(p=>p.path)).size,pages.length);
 for(const p of pages){const meta=pageMeta(p.path,live);assert.equal(meta.alternates.canonical,'https://www.indiagully.com'+p.path);assert.ok(meta.description);assert.equal(meta.openGraph.url,meta.alternates.canonical);assert.ok(meta.twitter.images[0].startsWith('https://'));}
 assert.equal(pageMeta('/admin',live).robots.index,false);
});
test('structured data contains contact details without invented reviews, addresses or offers',()=>{
 for(const p of pages){const text=JSON.stringify(structuredData(p.path,live));assert.ok(text.includes('hello@indiagully.com'));assert.ok(!/streetAddress|latitude|longitude|AggregateRating|priceCurrency|availability/.test(text));}
 assert.ok(!jsonLd({text:'</script><script>alert(1)</script>'}).includes('<'));
});
const source={publicationApproved:true,public:{slug:'public-asset',title:'Approved name',city:'Jaipur',region:'Rajasthan',sector:'Hospitality',type:'Hotel',description:'Approved description',image:'/images/jaipur.jpg',focus:[],contexts:[]},private:{address:'123 Private Road',latitude:26.9,ownerEmail:'owner@example.com',documents:['secret.pdf']}};
test('public opportunity serialization drops exact address, owner and document data',()=>{
 const p=publicOpportunity({...source,public:{...source.public,address:'123 Private Road',latitude:26.9,ownerEmail:'owner@example.com',documents:['secret.pdf']}});
 assert.equal(p.location,'Jaipur, Rajasthan');assert.equal(p.locationPrecision,'city');
 const text=JSON.stringify(p);for(const value of ['123 Private','26.9','owner@example.com','secret.pdf'])assert.ok(!text.includes(value));
 assert.equal(publicOpportunity({...source,publicationApproved:false}),null);
 assert.equal(publicOpportunity({...source,public:{...source.public,city:'123 Private Road'}}),null);
});
test('confidential listings need independently approved identity masking',()=>{
 assert.equal(publicOpportunity({...source,confidential:true}),null);
 const masked=publicOpportunity({...source,confidential:true,identityReviewApproved:true,public:{...source.public,slug:'ig-opp-001',alias:'Hospitality opportunity'}});
 assert.equal(masked.title,'Hospitality opportunity');assert.equal(masked.image,'');
 assert.ok(!JSON.stringify(masked).includes('Approved name'));
});
test('all ad drafts have valid lengths, real landing pages and no active spend',()=>{
 for(const draft of campaignDrafts){assert.deepEqual(validateCampaignDraft(draft),{valid:true,errors:[]},draft.id);assert.ok(pages.some(p=>p.path===draft.path));assert.equal(draft.status,'paused');assert.equal(draft.dailyBudgetInr,null);assert.equal(draft.reviewRequired,true);}
 assert.equal(validateCampaignDraft({...campaignDrafts[0],headlines:['a'.repeat(31)]}).valid,false);
});
