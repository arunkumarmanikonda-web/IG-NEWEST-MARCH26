import test from 'node:test';import assert from 'node:assert/strict';import {catalogueRows,catalogueBatches} from '../lib/catalogue-csv.mjs';
const collect=async(source)=>{const a=[];for await(const r of source)a.push(r);return a;};
test('CSV streams quoted newlines, escaped quotes, BOM and split chunk boundaries',async()=>{
 const text='\uFEFFtitle,body\r\n"A, product","First\nSecond ""quoted"""\r\nAnother,Done\n';
 const file={stream:()=>new ReadableStream({start(c){for(const char of text)c.enqueue(new TextEncoder().encode(char));c.close();}})};
 assert.deepEqual(await collect(catalogueRows(file)),[{title:'A, product',body:'First\nSecond "quoted"'},{title:'Another',body:'Done'}]);
});
test('CSV larger than 1 MB streams into bounded requests with all products retained',async()=>{
 const file=new Blob(['title,body\n'+Array.from({length:1100},(_,i)=>'Product '+i+','+'a'.repeat(1000)).join('\n')]);
 assert.ok(file.size>1000000);const batches=await collect(catalogueBatches(file));assert.equal(batches.reduce((n,b)=>n+b.rows.length,0),1100);
 for(const b of batches){assert.ok(b.rows.length<=200);assert.ok(new TextEncoder().encode(JSON.stringify({rows:b.rows})).length<110000);}
});
test('Malformed fields fail without imposing an overall file ceiling',async()=>{
 await assert.rejects(()=>collect(catalogueRows(new Blob(['sku,body\nAA,Text']))),/title/);
 await assert.rejects(()=>collect(catalogueRows(new Blob(['title,body\nTest,"broken']))),/quotation/);
});
