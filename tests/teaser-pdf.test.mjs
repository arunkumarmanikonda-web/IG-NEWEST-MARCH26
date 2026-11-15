import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFName } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { createTeaserPDF, safeBriefImage } from '../lib/teaser-pdf.mjs';
import { briefContacts } from '../lib/brief-contacts.mjs';
import { businessDefaults } from '../lib/business.mjs';
const item={kind:'opportunity',slug:'test-property',title:'Hotel Rajshree & Spa',summary:'A hotel and spa proposition in Chandigarh.',body:'',public_data:{city:'Chandigarh',asset_class:'Hotel & wellness',image:'/images/rajshree.webp'}};
test('Brief image paths reject remote URLs, traversal and non-image files',()=>{
 assert.equal(safeBriefImage('/images/rajshree.webp'),'/images/rajshree.webp');
 for(const path of ['https://example.com/a.jpg','/images/../secret.jpg','/images/%2e%2e/a.jpg','/images/file.svg','/secret.png'])assert.equal(safeBriefImage(path),null);
});
test('Real estate names both advisers; HORECA defaults to Pavan',()=>{
 assert.deepEqual(briefContacts(item).map(x=>x.email),['akm@indiagully.com','amit.jhingan@indiagully.com']);
 assert.deepEqual(briefContacts({kind:'product'}).map(x=>x.email),['pavan@indiagully.com']);
});
test('Export is a compact PDF with selectable text, both contact links and a scannable enquiry QR',async()=>{
 const result=await createTeaserPDF(item,businessDefaults),document=await PDFDocument.load(result.bytes);
 assert.equal(document.getPageCount(),3);assert.ok(result.bytes.length<600000);
 const annotations=document.getPage(2).node.Annots().asArray().map(ref=>document.context.lookup(ref).lookup(PDFName.of('A')).lookup(PDFName.of('URI')).decodeText());
 assert.ok(annotations.some(x=>x.startsWith('mailto:akm@')));assert.ok(annotations.some(x=>x.startsWith('mailto:amit.jhingan@')));
 const loading=getDocument({data:result.bytes.slice(),useSystemFonts:true}),parsed=await loading.promise,page=await parsed.getPage(3),content=await page.getTextContent();
 const text=content.items.map(x=>x.str).join(' ');assert.match(text,/Arun Manikonda/);assert.match(text,/Amit Jhingan/);
 const viewport=page.getViewport({scale:2}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height);
 assert.equal(jsQR(pixels.data,canvas.width,canvas.height)?.data,'https://indiagully.com/contact?interest=Hotel+Rajshree+%26+Spa');await loading.destroy();
 assert.equal((await createTeaserPDF(item,businessDefaults)).etag,result.etag);
 assert.notEqual((await createTeaserPDF({...item,summary:'Updated approved text.'},businessDefaults)).etag,result.etag);
});
test('A property brief preserves every paragraph and closes with both advisers after the last detail page',async()=>{
 const paragraphs=Array.from({length:31},(_,i)=>'Section'+i+' opens here. '+('Approved property information. '.repeat(15))+'EndMarker'+i+'X.');
 const result=await createTeaserPDF({...item,body:paragraphs.join('\n\n')},businessDefaults,{draft:true});
 const loading=getDocument({data:result.bytes.slice()}),doc=await loading.promise;
 assert.ok(result.pages>3);assert.equal(result.pages,doc.numPages);
 let editorial='';
 for(let i=1;i<=doc.numPages;i++){
  const page=await doc.getPage(i),parts=(await page.getTextContent()).items;
  const text=parts.map(x=>x.str).join(' ');
  assert.match(text,/DRAFT - FOR INTERNAL REVIEW/);
  if(i>1 && i<doc.numPages)editorial+=' '+text;
  if(i===doc.numPages){assert.match(text,/Arun Manikonda/);assert.match(text,/Amit Jhingan/);}
  for(const part of parts.filter(x=>x.str.trim())){
   assert.ok(part.transform[4]>=39 && part.transform[4]+part.width<=557,'Text outside frame');
   assert.ok(part.transform[5]>=25,'Text below frame');
  }
 }
 for(let i=0;i<paragraphs.length;i++)assert.equal(editorial.split('EndMarker'+i+'X.').length,2,'Missing or duplicate paragraph '+i);
 await loading.destroy();
});
test('Long titles and six facts stay inside the frame without crowding the draft label',async()=>{
 const record={...item,title:'A distinctive hospitality and commercial investment opportunity with a long property name',public_data:{...item.public_data,sector:'Hospitality',transaction_type:'Sale by private treaty',area:'123,456',area_unit:'square feet',keys:100,reference:'EXAMPLE-REFERENCE'}};
 const result=await createTeaserPDF(record,businessDefaults,{draft:true}),loading=getDocument({data:result.bytes.slice()}),doc=await loading.promise;
 for(let i=1;i<=3;i++){
  const page=await doc.getPage(i),content=await page.getTextContent();
  for(const part of content.items.filter(x=>x.str.trim())){
   assert.ok(part.transform[4]>=39&&part.transform[4]+part.width<=556,`page ${i}: horizontal overflow for ${part.str}`);
   assert.ok(part.transform[5]>=25,`page ${i}: text below frame for ${part.str}`);
  }
  if(i===2){
   const label=content.items.find(x=>x.str==='DRAFT - FOR INTERNAL REVIEW'),heading=content.items.find(x=>x.str==='THE PROPERTY PERSPECTIVE');
   assert.ok(label.transform[5]-heading.transform[5]>10);
   assert.ok(content.items.some(x=>x.str==='EXAMPLE-REFERENCE'));
  }
 }
 await loading.destroy();
});
test('A short product section starts in the left column and keeps the HORECA adviser',async()=>{
 const result=await createTeaserPDF({kind:'product',title:'Porcelain dining collection',summary:'Hospitality tableware.',body:'## Plan your requirement\n\nShare your quantities and specifications.',public_data:{}},businessDefaults);
 const loading=getDocument({data:result.bytes.slice()}),doc=await loading.promise;
 const content=await(await doc.getPage(2)).getTextContent();
 assert.equal(content.items.find(x=>x.str==='Plan your requirement').transform[4],40);
 const closing=(await(await doc.getPage(3)).getTextContent()).items.map(x=>x.str).join(' ');
 assert.match(closing,/Pavan Manikonda/);assert.doesNotMatch(closing,/Arun Manikonda/);
 await loading.destroy();
});

test('Assigned site photography is embedded on every page of a property brief',async()=>{
 const record={...item,public_data:{...item.public_data,image:'/images/shirdi-hotel-exterior.jpg'}};
 const result=await createTeaserPDF(record,businessDefaults);
 const document=await PDFDocument.load(result.bytes);
 for(const page of document.getPages()){
  const resources=page.node.Resources().lookup(PDFName.of('XObject'));
  const pictures=resources.values().map(ref=>document.context.lookup(ref).dict);
  assert.ok(pictures.some(dict=>dict.get(PDFName.of('Width'))?.asNumber()===1280 && dict.get(PDFName.of('Height'))?.asNumber()===960));
 }
});
test('A temporary failure loading an assigned photograph can be retried',async t=>{
 const record={...item,public_data:{...item.public_data,image:'/images/library/test-retry.jpg'}};
 const {readFile}=await import('node:fs/promises');
 const photo=await readFile('public/images/shirdi-hotel-exterior.jpg');
 const fetch=t.mock.method(globalThis,'fetch',async()=>new Response('',{status:503}));
 await assert.rejects(createTeaserPDF(record,businessDefaults),/photograph/);
 fetch.mock.mockImplementation(async()=>new Response(photo,{headers:{'content-type':'image/jpeg'}}));
 assert.equal((await createTeaserPDF(record,businessDefaults)).pages,3);
 assert.equal(fetch.mock.callCount(),2);
});
