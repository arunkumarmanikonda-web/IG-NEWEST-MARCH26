import { PDFDocument, rgb, PDFString, pushGraphicsState, popGraphicsState, setGraphicsState, rectangle, clip, endPath } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { narrativeParagraphs, teaserData } from './teaser.mjs';
import { propertyPhotoURL } from './listing-images.mjs';
import { listingLifecycle, listingStatusText } from './listing-lifecycle.mjs';
import { briefContacts } from './brief-contacts.mjs';

const W = 595.28, H = 841.89, M = 40, CW = W - M * 2;
const ink = rgb(.13,.14,.15), muted = rgb(.39,.41,.42), line = rgb(.84,.82,.77), paper = rgb(.994,.992,.987), gold = rgb(.70,.57,.32), paleGold = rgb(.96,.945,.905), white = rgb(1,1,1), pearl = rgb(.92,.92,.90);
const pdfCache = new Map();
const safeText = value => String(value || '').replace(/₹/g,'INR ').replace(/[–—‑]/g,'-').replace(/\u00a0/g,' ').replace(/[^\x20-\x7E\u00a1-\u00ff\u2018-\u201d\u2022\u2026\n]/g,'').trim();
export function safeBriefImage(path) { return typeof path === 'string' && /^\/images\/[a-zA-Z0-9._/-]+\.(?:jpg|jpeg|png|webp)$/i.test(path) && !path.includes('..') ? path : null; }
const fontFiles = ['LiberationSerif-Regular.ttf','LiberationSerif-Italic.ttf','LiberationSans-Regular.ttf','LiberationSans-Bold.ttf'];

function textLines(text, font, size, width) {
 const lines = [];
 for (const paragraph of safeText(text).split('\n')) {
  let current = '';
  for (let word of paragraph.split(/\s+/).filter(Boolean)) {
   while (font.widthOfTextAtSize(word,size) > width) {
    if (current) { lines.push(current); current=''; }
    let n = Math.max(1, Math.floor(word.length * width / font.widthOfTextAtSize(word,size)));
    while (n>1 && font.widthOfTextAtSize(word.slice(0,n),size)>width) n--;
    lines.push(word.slice(0,n)); word=word.slice(n);
   }
   const next = current ? current + ' ' + word : word;
   if (current && font.widthOfTextAtSize(next,size) > width) { lines.push(current); current=word; } else current=next;
  }
  if(current) lines.push(current);
 }
 return lines;
}
function text(page, value, x, top, font, size=11, color=ink) {
 page.drawText(safeText(value), { x, y:H-top-size, size, font, color });
}
function block(page,value,x,top,width,font,size=11,leading=15,maxLines=99,color=ink,justify=false){
 const allLines=textLines(value,font,size,width),lines=allLines.slice(0,maxLines);
 if(allLines.length>maxLines){let last=lines.at(-1);while(font.widthOfTextAtSize(last+'…',size)>width)last=last.slice(0,-1);lines[lines.length-1]=last.trimEnd()+'…';}
 lines.forEach((value,index)=>justifiedLine(page,{value,font,size,justify:justify && index<lines.length-1},x,top+index*leading,width,color));
 return lines.length*leading;
}
function link(page,x,top,width,height,url) {
 const annotation=page.doc.context.register(page.doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,H-top-height,x+width,H-top],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}}));
 page.node.addAnnot(annotation);
}
async function imageBytes(path,origin,property) {
 path=safeBriefImage(path); if(!path)return null;
 let raw;
 if (!path.startsWith('/images/generated/') && !path.startsWith('/images/library/')) {
  try { raw=await readFile(resolve(process.cwd(),'public',path.slice(1))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
 }
 if (!raw) {
  const response=await fetch(new URL(property ? propertyPhotoURL(path) : path,origin),{signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
  if(!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('The selected brief photograph could not be loaded.');
  raw=Buffer.from(await response.arrayBuffer());
  if(raw.length>12000000) throw new Error('The selected brief photograph exceeds the rendering budget.');
 }
 const img=await loadImage(raw),scale=Math.min(1,1600/img.width);
 if(scale===1 && raw[0]===0xff && raw[1]===0xd8) return raw;
 const canvas=createCanvas(Math.round(img.width*scale),Math.round(img.height*scale));
 canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
 return canvas.toBuffer('image/jpeg',88);
}
// Reuse the approved photograph, with clipping rather than raster crops.
function photograph(page,image,{x=0,top=0,width=W,height=H,zoom=1,position=.5}={}){
 if(!image)return;
 const scale=Math.max(width/image.width,height/image.height)*zoom;
 const iw=image.width*scale,ih=image.height*scale;
 page.pushOperators(pushGraphicsState(),rectangle(x,H-top-height,width,height),clip(),endPath());
 page.drawImage(image,{x:x+(width-iw)*position,y:H-top-height+(height-ih)/2,width:iw,height:ih});
 page.pushOperators(popGraphicsState());
}
function fullBleed(page, image, { closing = false } = {}) {
 page.drawRectangle({ x:0, y:0, width:W, height:H, color:ink });
 photograph(page,image,{zoom:closing?1.03:1,position:closing ? .44 : .5});
 // The image stays luminous above the title; the lower text sits on a deep veil.
 // A native PDF luminosity mask avoids raster seams and keeps text selectable.
  const ctx=page.doc.context;
  const values=closing?[.97,.92,.12,.38]:[.96,.66,.10,.38];
  const functions=values.slice(1).map((value,index)=>({FunctionType:2,Domain:[0,1],C0:[values[index]],C1:[value],N:1}));
  const shading=ctx.register(ctx.obj({ShadingType:2,ColorSpace:'DeviceGray',Coords:[0,0,0,H],Extend:[true,true],Function:{FunctionType:3,Domain:[0,1],Bounds:closing?[.34,.70]:[.32,.65],Encode:[0,1,0,1,0,1],Functions:functions}}));
  const mask=ctx.register(ctx.flateStream('/Veil sh',{Type:'XObject',Subtype:'Form',BBox:[0,0,W,H],Group:{S:'Transparency',CS:'DeviceGray',I:true},Resources:{Shading:{Veil:shading}}}));
  const state=ctx.register(ctx.obj({Type:'ExtGState',SMask:{S:'Luminosity',G:mask}}));
  const stateKey=page.node.newExtGState('PhotoVeil',state);
  page.pushOperators(pushGraphicsState(),setGraphicsState(stateKey));
  page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(.035,.042,.045)});
  page.pushOperators(popGraphicsState());
}
function fitSize(value,font,width,maxLines,initial,minimum){
 let size=initial;while(textLines(value,font,size,width).length>maxLines&&size>minimum)size--;
 return size;
}
function narrativeLayout(paragraphs,font,serif,width,size){
 const rows=[];
 for(const paragraph of paragraphs){
  const heading=paragraph.startsWith('## '),content=heading?paragraph.slice(3):paragraph.replace(/^[-*] /gm,'• ');
  const face=heading?serif:font,fontSize=heading?size+4:size,leading=heading?size+7:size+4;
  if(heading&&rows.length)rows.push({gap:5});
  // A soft return from an imported document is a space. List items keep their own final line.
  const segments=content.split(/\n(?=\s*• )/);
  let begin=true;
  for(const segment of segments){
   const lines=textLines(segment.replace(/\s+/g,' '),face,fontSize,width);
   lines.forEach((value,index)=>{
    rows.push({value,font:face,size:fontSize,leading,heading,begin,paragraph,justify:!heading&&index<lines.length-1});
    begin=false;
   });
  }
  rows.push({gap:heading?6:10,paragraphEnd:!heading});
 }
 return rows;
}
function rowHeight(row){return row.gap||row.leading;}
function columnSplit(rows,height){
 const total=rows.reduce((sum,row)=>sum+rowHeight(row),0);
 if(total<=height&&rows.filter(row=>row.paragraphEnd).length<=1)return [rows,[]];
 let cumulative=0,chosen=0,difference=Infinity;
 for(let i=0;i<rows.length-1;i++){
  cumulative+=rowHeight(rows[i]);
  if(rows[i].paragraphEnd&&cumulative<=height&&total-cumulative<=height&&Math.abs(total/2-cumulative)<difference){chosen=i+1;difference=Math.abs(total/2-cumulative);}
 }
 if(chosen)return [rows.slice(0,chosen),rows.slice(chosen)];
 const target=Math.min(height,total/2);cumulative=0;
 for(let i=0;i<rows.length;i++){
  const next=rowHeight(rows[i]);
  if(cumulative+next>target&&i>0){chosen=i;break;}cumulative+=next;
 }
 if(!chosen)chosen=rows.length;
 // Keep a heading and its opening lines together at a column break.
 let prior=chosen-1;while(prior>=0&&rows[prior].gap)prior--;
 if(prior>=0&&rows[prior].heading)chosen=prior;
 if(chosen===0)return [rows,[]];
 return [rows.slice(0,chosen),rows.slice(chosen)];
}
// Keep paragraphs together when they fit. Oversized paragraphs flow by line.
function takeColumn(rows,start,height) {
 let end=start,used=0,lastBreak=start;
 while(end<rows.length && used+rowHeight(rows[end])<=height){
  used+=rowHeight(rows[end]);
  if(rows[end].paragraphEnd)lastBreak=end+1;
  end++;
 }
 if(end===rows.length)return end;
 if(lastBreak>start && rows.slice(lastBreak,end).some(row=>row.heading))return lastBreak;
 if(lastBreak>start && used-rows.slice(start,lastBreak).reduce((sum,row)=>sum+rowHeight(row),0)<height*.32)return lastBreak;
 // A heading needs room for at least two lines of its paragraph.
 let cursor=end,bodyLines=0;
 while(cursor>start && bodyLines<2){
  const row=rows[--cursor];
  if(row.heading)return cursor>start?cursor:end;
  if(row.value)bodyLines++;
 }
 return end;
}
function drawPropertyColumns(page,rows,top,bottom,width,start) {
 let index=start;
 const height=bottom-top;
 const endFirst=takeColumn(rows,index,height);
 let endSecond=takeColumn(rows,endFirst,height);
 if(endSecond<rows.length){
  // When the following page is needed, move a partially fitting section intact.
  let section=endSecond-1;
  while(section>start && !(rows[section].heading && rows[section].begin))section--;
  if(section>start && rows.slice(start,section).reduce((total,row)=>total+rowHeight(row),0)>height*.78)endSecond=section;
 }
 const chunk=rows.slice(index,endSecond);
 const balanced=columnSplit(chunk,height);
 // Use balanced columns only when both measured columns fit their frame.
 const columns=balanced.every(column=>column.reduce((n,row)=>n+rowHeight(row),0)<=height)
   ? balanced : [rows.slice(index,Math.min(endFirst,endSecond)),rows.slice(Math.min(endFirst,endSecond),endSecond)];
 columns.forEach((column,side)=>{
  let y=top;
  for(const row of column){
   if(!row.value && y===top)continue;
   if(row.value)justifiedLine(page,row,M+side*(width+28),y,width);
   y+=rowHeight(row);
  }
 });
 return endSecond;
}
async function companionPhoto(path,view) {
 if(!safeBriefImage(path)||path.startsWith('/images/library/')||path.startsWith('/images/generated/'))return null;
 const photo=resolve(process.cwd(),'public',path.slice(1).replace(/\.[^/.]+$/,'-'+view+'.jpg'));
 try {return await readFile(photo);}catch(error){if(error.code==='ENOENT')return null;throw error;}
}
function justifiedLine(page,row,x,top,width,color=ink){
 const words=row.value.split(' ');
 if(!row.justify||words.length<2){text(page,row.value,x,top,row.font,row.size,color);return;}
 const widths=words.map(word=>row.font.widthOfTextAtSize(word,row.size));
 const gap=(width-widths.reduce((total,w)=>total+w,0))/(words.length-1);
 for(const [index,word] of words.entries()){
  text(page,word,x,top,row.font,row.size,color);
  x+=widths[index]+gap;
 }
}
export async function createTeaserPDF(item,business,{draft=false,origin='https://indiagully.com'}={}) {
 const key=createHash('sha256').update(JSON.stringify({item,business,draft,origin,design:12})).digest('hex');
 if(pdfCache.has(key))return pdfCache.get(key);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const [serif,italic,sans,bold]=await Promise.all(fontFiles.map(async name=>pdf.embedFont(await readFile(resolve(process.cwd(),'assets/fonts/briefs',name)),{subset:true})));
 const t=teaserData(item),product=item.kind==='product',contacts=briefContacts(item,business);
 const inactive=item.kind==='opportunity'&&!listingLifecycle(item).isAvailable;
 const url=new URL(inactive?'/opportunities':'/contact',origin);if(!inactive)url.searchParams.set('interest',item.title);
 const [darkRaw,whiteRaw,sourceRaw,qrRaw]=await Promise.all([
  readFile(resolve(process.cwd(),'public/logo-dark.png')),
  readFile(resolve(process.cwd(),'public/logo-white.png')),
  imageBytes(t.image,origin,item.kind==='opportunity'),
  QRCode.toBuffer(url.href,{type:'png',width:264,margin:3,color:{dark:'#242422',light:'#ffffff'}}),
 ]);
 // Keep a typographic cover when no approved photograph is available.
 const [darkLogo,whiteLogo,hero,qr]=await Promise.all([pdf.embedPng(darkRaw),pdf.embedPng(whiteRaw),sourceRaw?pdf.embedJpg(sourceRaw):null,pdf.embedPng(qrRaw)]);
 const property=item.kind==='opportunity';
 const [overviewPhoto,closingPhoto]=await Promise.all(['overview','closing'].map(async view=>{
  const bytes=property && hero ? await companionPhoto(t.image,view):null;
  return bytes?pdf.embedJpg(bytes):hero;
 }));
 const imageNote=sourceRaw&&t.illustrative&&!product ? 'Illustrative AI-generated concept; not a property photograph.' : '';
 function frame(page,{dark=false,headerDark=dark,label=t.label,number}={}){
  page.drawRectangle({x:21,y:21,width:W-42,height:H-42,borderColor:gold,borderWidth:.65});
  const logo=headerDark?whiteLogo:darkLogo,width=174,height=width*logo.height/logo.width;
  page.drawImage(logo,{x:M,y:H-35-height,width,height});
  text(page,label,W-M-sans.widthOfTextAtSize(label,7),45,sans,7,headerDark?pearl:muted);
  if(draft)text(page,'DRAFT - FOR INTERNAL REVIEW',M,83,bold,7.5,headerDark?white:muted);
  page.drawLine({start:{x:M,y:H-790},end:{x:W-M,y:H-790},color:gold,thickness:.45});
  text(page,product?'HORECA PROCUREMENT  |  INDIA GULLY':'REAL ESTATE ADVISORY  |  INDIA GULLY',M,799,sans,6.3,dark?pearl:muted);
  text(page,String(number).padStart(3,'0'),W-M-14,799,sans,6.3,dark?pearl:muted);
  text(page,business.legal_name,M,810,sans,5.2,dark?pearl:muted);
 }
 // 1. The photograph leads; title and location sit in a quiet lower-third composition.
 const cover=pdf.addPage([W,H]);fullBleed(cover,hero);frame(cover,{dark:true,number:1});
 text(cover,product?'HORECA  /  PRODUCT PRESENTATION':inactive?'REAL ESTATE  /  '+(listingLifecycle(item).archived?'ARCHIVED':listingLifecycle(item).canonicalLabel.toUpperCase()):'REAL ESTATE  /  OPPORTUNITY BRIEF',M,570,bold,8,pearl);
 cover.drawLine({start:{x:M,y:H-591},end:{x:M+40,y:H-591},color:gold,thickness:1});
 const titleWidth=CW-55;
 let coverSize=fitSize(t.title,serif,titleWidth,3,42,22);
 if(textLines(t.title,serif,coverSize,titleWidth).length===3)coverSize=Math.min(coverSize,34);
 const titleHeight=block(cover,t.title,M,607,titleWidth,serif,coverSize,coverSize+3,3,white);
 block(cover,t.line.toUpperCase(),M,607+titleHeight+22,CW,sans,9,13,2,pearl);
 if(imageNote)block(cover,imageNote,M,775,CW,sans,6.2,8,1,pearl);
 // 2. Report-inspired image masthead, prominent facts and balanced editorial columns.
 const detail=pdf.addPage([W,H]);detail.drawRectangle({x:0,y:0,width:W,height:H,color:paper});
 const facts=t.facts.length?t.facts.slice(0,6):[['Enquiries','By appointment']];
 const extendedFacts=t.facts.slice(6);
 const bandHeight=facts.length>3?190:224;
 detail.drawRectangle({x:0,y:H-bandHeight,width:W,height:bandHeight,color:ink});
 photograph(detail,overviewPhoto,{height:bandHeight});
 detail.drawRectangle({x:0,y:H-bandHeight,width:W,height:bandHeight,color:ink,opacity:.66});
 frame(detail,{headerDark:true,label:product?'PRODUCT DETAILS':'PROPERTY OVERVIEW',number:2});
 text(detail,product?'SPECIFICATION & PROCUREMENT':'THE PROPERTY PERSPECTIVE',M,bandHeight-94,bold,7.8,pearl);
 text(detail,product?'The finer details.':'The opportunity, in focus.',M,bandHeight-68,serif,32,white);
 const factColumns=Math.min(3,facts.length),factRows=Math.ceil(facts.length/factColumns),factWidth=CW/factColumns;
 const factStart=bandHeight+23;
 let factBottom=factStart;
 for(let row=0;row<factRows;row++){
  const cells=facts.slice(row*factColumns,(row+1)*factColumns).map(([label,rawValue])=>{
   const value=label==='Area'?rawValue.replace(/^([0-9]+(?:\.[0-9]+)?)(?= |$)/,n=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:4})):rawValue;
   let size=fitSize(value,serif,factWidth-24,2,factColumns===2?24:21,13);
   if(!value.includes(' '))size=Math.min(size,Math.max(12,(factWidth-24)/serif.widthOfTextAtSize(value,1)));
   if(textLines(value,serif,size,factWidth-24).length>1)size=Math.min(size,21);
   const lineCount=textLines(value,serif,size,factWidth-24).length;
   if(property && lineCount>4)extendedFacts.push([label,value]);
   const lines=property?Math.min(4,lineCount):2;
   return {label,value,size,lines};
  });
  const labelOffset=Math.max(49,...cells.map(c=>c.lines*(c.size+2)+4));
  cells.forEach(({label,value,size,lines},column)=>{
   const x=M+column*factWidth;
   if(column)detail.drawLine({start:{x:x-13,y:H-factBottom-2},end:{x:x-13,y:H-factBottom-labelOffset},color:line,thickness:.6});
   block(detail,value,x,factBottom,factWidth-24,serif,size,size+2,lines,ink);
   text(detail,label.toUpperCase(),x,factBottom+labelOffset,sans,6.8,muted);
  });
  factBottom+=labelOffset+18;
 }
 const ruleTop=factBottom+4;
 detail.drawLine({start:{x:M,y:H-ruleTop},end:{x:W-M,y:H-ruleTop},color:gold,thickness:.55});
 const introTop=ruleTop+19;
 const introHeight=block(detail,(inactive?'Status: '+listingStatusText(item)+'. This brief is retained for reference and is not a current available offer. ':'')+t.summary,M,introTop,CW,serif,14.5,19.5,property?20:4,ink,property);
 let start=introTop+introHeight+23;
 const bodyWidth=(CW-28)/2;
 const paragraphs=narrativeParagraphs(item.body,item.summary);
 if(!property&&!paragraphs.length)paragraphs.push(product?'Share your quantities, destination and required specification with our procurement team. We will prepare a quotation around your requirement.':'Request the detailed property information and discuss your objectives directly with our real estate advisers.');
 // A short introductory paragraph spans the page before paired editorial sections.
 if(paragraphs[0]&&!paragraphs[0].startsWith('## ')&&paragraphs.slice(1).some(p=>p.startsWith('## '))){
  const lead=textLines(paragraphs[0],sans,10.3,CW);
  if(lead.length<=4){
   paragraphs.shift();
   lead.forEach((value,index)=>justifiedLine(detail,{value,font:sans,size:10.3,justify:index<lead.length-1},M,start+index*14.3,CW));
   start+=lead.length*14.3+18;
  }
 }
 if(property){
  if(extendedFacts.length)paragraphs.push('## Additional particulars',...extendedFacts.map(([label,value])=>label+' · '+value));
  const rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,10.6);
  let index=drawPropertyColumns(detail,rows,start,750,bodyWidth,0);
  while(index<rows.length){
   while(index<rows.length && !rows[index].value)index++;
   if(index>=rows.length)break;
   const page=pdf.addPage([W,H]);
   const first=rows[index], readHeading=first.heading && first.begin && textLines(first.paragraph.slice(3),serif,29,CW).length<=2;
   const pageHeading=readHeading?first.paragraph.slice(3):'Property particulars';
   if(readHeading){while(index<rows.length && rows[index].heading)index++;while(index<rows.length && !rows[index].value)index++;}
   const inset=26,wideWidth=CW-inset*2;
   const remaining=rows.slice(index);
   const wideRows=remaining[0]?.begin?narrativeLayout(remaining.filter(row=>row.begin).map(row=>row.paragraph),sans,serif,wideWidth,12.2):null;
   const wideHeight=wideRows?.reduce((sum,row)=>sum+rowHeight(row),0);
   const singleColumn=wideRows && wideHeight<=486;
   const band=singleColumn?Math.min(348,716-wideHeight):240;
   page.drawRectangle({x:0,y:0,width:W,height:H,color:paper});
   page.drawRectangle({x:0,y:H-band,width:W,height:band,color:ink});
   photograph(page,closingPhoto,{height:band});
   page.drawRectangle({x:0,y:H-band,width:W,height:band,color:ink,opacity:.61});
   frame(page,{headerDark:true,label:'PROPERTY PARTICULARS',number:pdf.getPageCount()});
   text(page,'REAL ESTATE ADVISORY',M,band-108,bold,8,pearl);
   block(page,pageHeading,M,band-83,CW,serif,29,32,2,white);
   if(singleColumn){
    let y=band+35;
    for(const row of wideRows){
     if(row.value)justifiedLine(page,row,M+inset,y,wideWidth);
     y+=rowHeight(row);
    }
    index=rows.length;
   }else index=drawPropertyColumns(page,rows,band+34,752,bodyWidth,index);

  }
 }else{
 const available=688-start;
 let rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,10.3);
 if(rows.reduce((sum,row)=>sum+rowHeight(row),0)>available*2)rows=narrativeLayout(paragraphs,sans,serif,bodyWidth,9.5);
 const columns=columnSplit(rows,available);let truncated=false;
 columns.forEach((column,index)=>{
  let top=start;
  while(column[0]?.gap)column.shift();
  for(const row of column){
   const height=rowHeight(row);
   if(top+height>688||(row.heading&&top+height+25>688)){truncated=true;break;}
   if(row.value)justifiedLine(detail,row,M+index*(bodyWidth+28),top,bodyWidth);
   top+=height;
  }
 });
 if(truncated)text(detail,'Further detail is available through our advisory team.',M,694,italic,8,muted);
 const calloutTop=716;
 detail.drawRectangle({x:M,y:H-calloutTop-47,width:CW,height:47,color:paleGold});
 detail.drawLine({start:{x:M,y:H-calloutTop},end:{x:M,y:H-calloutTop-47},color:gold,thickness:2});
 text(detail,product?'Bring your procurement brief to us.':'Request a closer look.',M+13,calloutTop+8,bold,10,ink);
 text(detail,product?'Discuss quantities, specifications and delivery with Pavan.':'Connect with Arun Manikonda and Amit Jhingan for the next step.',M+13,calloutTop+26,sans,9,muted);
 link(detail,M,calloutTop,CW,47,url.href);
 text(detail,'Indicative information. Subject to availability, verification and agreed transaction terms.',M,775,sans,6.1,muted);
 }
 // 3. A photographic closing hero with a compact, aligned advisory contact block.
 const closing=pdf.addPage([W,H]);fullBleed(closing,closingPhoto,{closing:true});frame(closing,{dark:true,label:product?'PROCUREMENT ENQUIRIES':'PRIVATE ENQUIRIES',number:pdf.getPageCount()});
 block(closing,t.title.toUpperCase(),M,394,CW,bold,8,12,2,pearl);
 closing.drawLine({start:{x:M,y:H-427},end:{x:M+40,y:H-427},color:gold,thickness:1});
 text(closing,product?'Considered sourcing.':'Let’s discuss',M,447,serif,40,white);
 text(closing,product?'Personal attention.':inactive?'your next move.':'the opportunity.',M,493,italic,40,white);
 const invitation=product?'Tell us what your project needs. We will help you shape the specification, quantities and next procurement step.':inactive?'This property is not a current available offer. Explore our available properties and discuss your investment brief with our real estate advisers.':'Request the property information, discuss your investment brief and take the next step with our real estate advisers.';
 block(closing,invitation,M,552,CW-20,sans,10.5,15,2,pearl,property);
 closing.drawLine({start:{x:M,y:H-594},end:{x:W-M,y:H-594},color:gold,thickness:.45,opacity:.75});
 const contactTop=610,colWidth=(CW-28)/2;
 contacts.forEach((contact,index)=>{
  const x=M+index*(colWidth+28);
  text(closing,contact.name,x,contactTop,serif,20,white);
  text(closing,contact.role,x,contactTop+27,sans,8,pearl);
  text(closing,contact.phone,x,contactTop+47,sans,10.5,white);
  text(closing,contact.email,x,contactTop+65,sans,9.5,white);
  link(closing,x-2,contactTop+45,colWidth,17,'tel:'+contact.phone.replace(/\s/g,''));
  link(closing,x-2,contactTop+63,colWidth,17,'mailto:'+contact.email+'?subject='+encodeURIComponent(item.title+' | '+(product?'Procurement':'Property')+' enquiry'));
 });
 const buttonTop=716,buttonWidth=CW-123;
 closing.drawRectangle({x:M,y:H-buttonTop-32,width:buttonWidth,height:32,borderColor:gold,borderWidth:.7,color:ink,opacity:.25});
 text(closing,product?'REQUEST A PERSONALISED QUOTATION':inactive?'EXPLORE AVAILABLE PROPERTIES':'ARRANGE A PRIVATE DISCUSSION',M+13,buttonTop+11,bold,8,white);
 const arrowX=M+buttonWidth-20,arrowY=H-buttonTop-16;
 closing.drawLine({start:{x:arrowX-9,y:arrowY},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 closing.drawLine({start:{x:arrowX-2,y:arrowY+4},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 closing.drawLine({start:{x:arrowX-2,y:arrowY-4},end:{x:arrowX+2,y:arrowY},color:white,thickness:.7});
 link(closing,M,buttonTop,buttonWidth,32,url.href);
 text(closing,'www.indiagully.com',M,759,sans,8,pearl);
 const qrX=W-M-70,qrTop=697;
 closing.drawImage(qr,{x:qrX,y:H-qrTop-70,width:70,height:70});
 text(closing,inactive?'SCAN TO EXPLORE':'SCAN TO ENQUIRE',qrX+2,774,sans,6,pearl);
 link(closing,qrX,qrTop,70,84,url.href);
 if(imageNote)block(closing,imageNote,M,775,CW-100,sans,6.1,8,1,pearl);
 pdf.setTitle(t.title+' | India Gully');pdf.setAuthor('India Gully');pdf.setSubject(t.label);pdf.setCreator('India Gully');
 const bytes=await pdf.save();const result={bytes,pages:pdf.getPageCount(),etag:'"'+key+'"'};
 if(pdfCache.size>=30)pdfCache.delete(pdfCache.keys().next().value);pdfCache.set(key,result);return result;
}
