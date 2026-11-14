import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {loadImage} from '@napi-rs/canvas';import {renderCataloguePage,cropCatalogueImage} from '../lib/catalogue-media.mjs';
test('real PDF page rendering retains its products, page count and usable image crops',async()=>{const bytes=await readFile(new URL('./fixtures/catalogue.pdf',import.meta.url)),page=await renderCataloguePage(bytes,1);assert.equal(page.page_count,2);assert.equal(page.candidates.length,2);const plate=await loadImage(page.candidates[0].image),lamp=await loadImage(page.candidates[1].image);assert.ok(Math.abs(plate.width/plate.height-1)<.1);assert.ok(lamp.height/lamp.width>2);assert.deepEqual(page.candidates.map(c=>c.id),['IMG1','IMG2']);for(const c of page.candidates){const source=await loadImage(c.image),label=await loadImage(c.labelled);assert.equal(label.height,source.height+72);assert.ok(label.width>=320);}assert.match(page.text,/TEST-P27/);assert.match(page.text,/220-240 V/);const crop=await cropCatalogueImage(page.image,[115,210,365,390]);const im=await loadImage(crop);assert.equal(im.width,1000);assert.equal(im.height,1000);assert.equal(await cropCatalogueImage(page.image,[]),null);await assert.rejects(renderCataloguePage(bytes,3),/outside/);});

import {resolveCatalogueImages} from '../lib/brand-catalogue.mjs';
test('printed manufacturer codes resolve swapped vision image proposals on the real PDF',async()=>{const page=await renderCataloguePage(await readFile(new URL('./fixtures/catalogue.pdf',import.meta.url)),1);const result={products:[{reference:'TEST-P27',image_id:'IMG2'},{reference:'TEST-L42',image_id:'IMG1'}]};resolveCatalogueImages(result,page.candidates,page.anchors);assert.deepEqual(result.products.map(p=>p.image_id),['IMG1','IMG2']);});
test('ambiguous or repeated manufacturer labels never override the vision proposal',()=>{const candidates=[{id:'IMG1',box:[0,0,100,100]},{id:'IMG2',box:[200,0,300,100]}],result={products:[{reference:'CODE-1',image_id:'IMG2'}]},anchor={text:'CODE-1',box:[140,40,160,60]};resolveCatalogueImages(result,candidates,[anchor]);assert.equal(result.products[0].image_id,'IMG2');resolveCatalogueImages(result,candidates,[anchor,anchor]);assert.equal(result.products[0].image_id,'IMG2');});

import {withPrivatePdf} from '../lib/private-pdf.mjs';
import {adminResponse} from '../lib/admin-response.mjs';
test('saved catalogues use byte ranges, retain product evidence and reject a full-body fallback',async()=>{
 const pdf=await readFile(new URL('./fixtures/catalogue.pdf',import.meta.url));
 const url='https://example.test/private-source';
 const got=[];
 const readRange=async(input,options)=>{
   assert.equal(input,url);
   const [,a,b]=/^bytes=(\d+)-(\d+)$/.exec(options.headers.Range);
   const end=Math.min(Number(b)+1,pdf.length);
   got.push(a);
   return new Response(pdf.subarray(Number(a),end),{status:206,headers:{'content-range':'bytes '+a+'-'+(end-1)+'/'+pdf.length}});
 };
 const {page,count}=await withPrivatePdf({url,size:pdf.length},async doc=>({page:await (await doc.getPage(1)).getTextContent(),count:doc.numPages}),readRange);
 assert.equal(count,2);
 assert.match(page.items.map(i=>i.str).join(' '),/TEST-P27/);
 assert.ok(got.length);
 await assert.rejects(withPrivatePdf({url},()=>{},()=>Promise.resolve(new Response(pdf))),/read in parts/);
 await assert.rejects(adminResponse(new Response('<!DOCTYPE html>',{status:504})),/504.*saved draft/);
});
