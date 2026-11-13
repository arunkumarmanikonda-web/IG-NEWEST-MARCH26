import {parseCSV} from './operations-spec.mjs';
const encoder = new TextEncoder();
// Stream complete CSV records, preserving quoted newlines and chunk boundaries.
// Limits apply to an individual product field, never the source file size.
export async function* catalogueRows(file) {
 const reader=file.stream().getReader(),decoder=new TextDecoder();
 let record='',quoted=false,header=null,line=0,skipLF=false;
 const row=(text)=>{
   if(!text.trim())return null;
   if(header===null){header=text.replace(/^\uFEFF/,'');if(!parseCSV(header+'\n'+header).some(x=>Object.hasOwn(x,'title')))throw new Error('CSV requires a title column.');return null;}
   const [data]=parseCSV(header+'\n'+text);line++;
   if(!data?.title||data.title.length<2||data.title.length>180)throw new Error('Product '+line+' needs a title of 2–180 characters.');
   for(const [key,value] of Object.entries(data))if(value.length>(key==='body'?6000:key==='summary'?500:500))throw new Error('Product '+line+': '+key+' is too long.');
   return data;
 };
 try {
  while(true){const {value,done}=await reader.read();const chunk=decoder.decode(value||new Uint8Array(),{stream:!done});
   for(const c of chunk){if(skipLF){skipLF=false;if(c==='\n')continue;}
    if(c==='"')quoted=!quoted;
    if(!quoted&&(c==='\n'||c==='\r')){const data=row(record);record='';skipLF=c==='\r';if(data)yield data;}
    else {record+=c;if(record.length>40000)throw new Error('One product record is too long. Split its specifications into valid fields.');}
   }
   if(done)break;
  }
  if(quoted)throw new Error('Unclosed CSV quotation');const data=row(record);if(data)yield data;
  if(!line)throw new Error('CSV requires at least one product.');
 } finally {await reader.cancel();}
}
export async function* catalogueBatches(file) {
 let rows=[],bytes=0,index=0;
 for await(const row of catalogueRows(file)){
  const size=encoder.encode(JSON.stringify(row)).length+1;
  if(rows.length&&(rows.length>=200||bytes+size>100000)){yield {index:index++,rows};rows=[];bytes=0;}
  rows.push(row);bytes+=size;
 }
 if(rows.length)yield {index,rows};
}
