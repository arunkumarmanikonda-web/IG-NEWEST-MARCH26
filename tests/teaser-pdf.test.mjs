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
test('Detailed briefs stop at three pages and drafts remain clearly marked',async()=>{
 const result=await createTeaserPDF({...item,body:('## Review\n\n'+('Approved property information. '.repeat(30))+'\n\n').repeat(20)},businessDefaults,{draft:true});
 assert.equal(result.pages,3);
 const loading=getDocument({data:result.bytes.slice()}),doc=await loading.promise;
 for(let i=1;i<=3;i++){const page=await doc.getPage(i),text=(await page.getTextContent()).items.map(x=>x.str).join(' ');assert.match(text,/DRAFT - FOR INTERNAL REVIEW/);if(i===3){assert.match(text,/Arun Manikonda/);assert.match(text,/Amit Jhingan/);}}
 await loading.destroy();
});
