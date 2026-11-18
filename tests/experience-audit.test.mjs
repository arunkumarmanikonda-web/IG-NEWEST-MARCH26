import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSearchIndex,filterSearch} from '../lib/site-search.mjs';
import {articlePractice,canonicalLocation,canonicalSector,reviewStatus,descriptiveAlt,readableParagraphs,productSpecificationFields,publicationIssues} from '../lib/customer-experience.mjs';
import {normaliseProcurementDraft} from '../lib/procurement.mjs';
import {normaliseShortlist,compareSelection,comparisonArea} from '../lib/shortlist.mjs';
import {portalReturn} from '../lib/portal-return.mjs';
import {publicDocuments} from '../lib/gullu.mjs';
test('customer search connects funding, distress, leasing and Hinglish to real records',()=>{
 const index=buildSearchIndex([{kind:'opportunity',slug:'hotel',title:'Jaisalkot hotel',public_data:{transaction_type:'Corporate insolvency resolution',city:'Jaisalmer'}},{kind:'retail_space',slug:'office',title:'Unitech office',public_data:{city:'Gurgaon',transaction_type:'Lease'}},{kind:'product',slug:'plate',title:'Ariane crockery',public_data:{}}]);
 for(const q of ['raise funds','fundraising','mujhe funding chahiye','debt refinancing'])assert.ok(filterSearch(index,{q}).some(r=>r.kind==='practice'),q);
 assert.ok(filterSearch(index,{q:'distressed hotel'}).some(r=>r.href==='/opportunities/hotel'));
 assert.ok(filterSearch(index,{q:'office kiraye gurugram'}).some(r=>r.kind==='retail_space'));
 assert.ok(filterSearch(index,{q:'bartan chahiye'}).some(r=>r.kind==='product'));
 assert.equal(canonicalLocation('Noida, Uttar Pradesh'),'Noida');
});
test('freshness never mistakes publication or a future date for verified availability',()=>{const now=Date.parse('2026-11-18');for(const d of [{published_at:'2026-11-18'},{availability_verified_at:'2026-12-01'},{availability_verified_at:'2026-09-01'}])assert.match(reviewStatus(d,now),/confirmation required/);assert.match(reviewStatus({availability_verified_at:'2026-11-17'},now),/Availability confirmed/);});
test('category and reading helpers keep editorial decisions consistent',()=>{assert.equal(canonicalSector({asset_class:'Office',sector:'Sector 90'}),'Commercial');assert.equal(articlePractice({category:'TRANSACTION ADVISORY'}).label,articlePractice({category:'Transaction Advisory'}).label);assert.equal(descriptiveAlt('do nothing','Alphathum offices'),'Alphathum offices');assert.ok(!('capacity' in productSpecificationFields('Cutlery')));assert.ok('capacity' in productSpecificationFields('Lighting'));const paragraphs=readableParagraphs(('A documented sentence with its context. ').repeat(35));assert.ok(paragraphs.length>1);assert.equal(paragraphs.join(' ').split('A documented').length,36);assert.ok(publicationIssues({kind:'retail_space',public_data:{price_label:'₹100 per sq ft'}}).some(x=>x.includes('rent period')));});
test('procurement drafts expire and safe login destinations retain the basket',()=>{const now=Date.now(),draft={saved_at:now,title:'Hotel opening',destination:'Kochi',required_by:'2026-12-01',notes:'Samples first',entity_id:'e'};assert.equal(normaliseProcurementDraft(draft).notes,'Samples first');assert.deepEqual(normaliseProcurementDraft({...draft,saved_at:now-25*3600000}),{});assert.equal(portalReturn('/horeca#quotation-basket'),'/horeca#quotation-basket');for(const bad of ['//evil.test','/horeca#quotation-basket\nhttps://evil.test','https://evil.test/shortlist'])assert.ok(!portalReturn(bad));});
test('shortlists reject arbitrary identifiers and cap comparison at three',()=>{const ids=[1,2,3,4].map(n=>`00000000-0000-4000-8000-00000000000${n}`);assert.deepEqual(normaliseShortlist([...ids,ids[0],null,'/admin']),ids);assert.deepEqual(compareSelection(ids.slice(0,3),ids[3]),ids.slice(0,3));assert.deepEqual(compareSelection(ids.slice(0,3),ids[0]),ids.slice(1,3));});
test('property comparison preserves differing area units and leasing basis',()=>{
 assert.equal(comparisonArea({area:'1.46',area_unit:'acres'}),'1.46 acres');
 assert.equal(comparisonArea({area:'20829.23',area_unit:'sq m'}),'20829.23 sq m');
 assert.equal(comparisonArea({area:'4,361 sq ft',area_unit:'sq ft'}),'4,361 sq ft');
 assert.equal(comparisonArea({area:400}),'400 (unit to confirm)');
 assert.equal(comparisonArea({area_range:'4,361 sq ft; area basis to confirm'}),'4,361 sq ft; area basis to confirm');
});
test('Gullu sees the same reviewed Park Plaza identity and historical qualification',()=>{const docs=publicDocuments({records:[{kind:'opportunity',slug:'park-plaza',title:'Park Plaza Ludhiana',summary:'One hotel owned by Majestic Hotels Limited.',public_data:{keys:'114',data_as_of:'Historical trading data through October 2024',management_agreement:'Sarovar agreement reported through December 2028; current terms require confirmation'}}]});const asset=docs.find(d=>d.href==='/opportunities/park-plaza');assert.equal(asset.title,'Park Plaza Ludhiana');assert.ok(asset.chunks.some(x=>x.includes('October 2024')));assert.ok(asset.chunks.some(x=>x.includes('Management agreement')));});
