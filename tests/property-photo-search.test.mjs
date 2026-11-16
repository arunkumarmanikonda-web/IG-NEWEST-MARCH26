import test from 'node:test';
import assert from 'node:assert/strict';
import {findPropertyPhoto,propertySearchTerms} from '../lib/property-photo-search.mjs';
import {listingImageBrief,listingVisualStyle} from '../lib/listing-images.mjs';
const record={title:'Examplefort Heritage Resort Investment in Jaisalmer',summary:'A completed heritage resort in Rajasthan.',public_data:{city:'Jaisalmer',region:'Rajasthan'}};
const info={width:1600,height:1000,mime:'image/jpeg',thumburl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/example.jpg',extmetadata:{LicenseShortName:{value:'CC0'}}};
test('Property search downloads a matching reusable file and retains its source',async()=>{
 assert.deepEqual(propertySearchTerms(record),['examplefort']);
 const files=[
  {title:'File:Another hotel.jpg',imageinfo:[info]},
  {title:'File:Examplefort logo.png',imageinfo:[info]},
  {title:'File:Examplefort terrace.jpg',imageinfo:[{...info,extmetadata:{LicenseShortName:{value:'CC BY-SA'}}}]},
  {title:'File:Examplefort hall.jpg',imageinfo:[{...info,thumburl:'https://example.org/photo.jpg'}]},
  {title:'File:Examplefort courtyard.jpg',imageinfo:[info]},
 ].map((page,index)=>({...page,index,pageid:index+1}));
 const calls=[];
 const result=await findPropertyPhoto(record,async url=>{
  calls.push(String(url));
  return calls.length===1?Response.json({query:{pages:files}}):new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/jpeg'}});
 });
 assert.equal(calls.length,2);assert.equal(calls[1],info.thumburl);assert.equal(result.pageId,5);assert.match(result.rights,/CC0.*curid=5/);
});
test('A confidential listing or generic city description does not trigger an external search',async()=>{
 for(const input of [{...record,public_data:{confidential:true}},{...record,title:'Hotel Investment in Jaisalmer'}])
  assert.equal(await findPropertyPhoto(input,()=>assert.fail('Unnecessary external request')),null);
});
test('Sketch directions use the supplied photo and support an illustrative fallback',()=>{
 assert.equal(listingVisualStyle('auto','Architectural sketch please'),'sketch');
 assert.equal(listingVisualStyle('auto','','A pencil drawing of the facade'),'sketch');
 assert.equal(listingVisualStyle('auto','Keep the original photograph','A sketch'),'photo');
 assert.equal(listingVisualStyle('photo','Sketch'),'photo');
 assert.match(listingImageBrief(record,{mode:'sketch',reference:true}),/@source/);
 assert.doesNotMatch(listingImageBrief(record,{mode:'sketch'}),/@source/);
});

test('Property display removes the intake frame and keeps a photograph without padding intact',async()=>{
 const {default:sharp}=await import('sharp');
 const {propertyPhotoFrame}=await import('../lib/property-photo-frame.mjs');
 const file=await sharp({create:{width:400,height:200,channels:3,background:'#364f60'}}).jpeg().toBuffer();
 const padded=await sharp(file).extend({top:40,bottom:40,left:0,right:0,background:'#f2f1ea'}).jpeg().toBuffer();
 const {height}=await sharp(await propertyPhotoFrame(padded)).metadata();
 assert.ok(height>=200 && height<=204);
 assert.deepEqual(await propertyPhotoFrame(file),file);
});
