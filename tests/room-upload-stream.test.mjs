import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectStoredRoomFile} from '../supabase/functions/ig-room-broker/inspect-upload.mjs';
const file={object_key:'private/id',bytes:8*1024**3,name:'deck.pdf'};
const storage={info:async()=>({data:{size:file.bytes}}),createSignedUrl:async()=>({data:{signedUrl:'https://storage.example/private'}})};
test('Multi-gigabyte room original validates using only a bounded prefix',async()=>{
 let canceled=false;let bytes=0;
 const fetcher=async(url,options)=>{assert.equal(options.headers.Range,'bytes=0-4095');return new Response(new ReadableStream({pull(c){const data=new Uint8Array(4096);data.set(new TextEncoder().encode('%PDF-1.7'));bytes+=data.length;c.enqueue(data);},cancel(){canceled=true;}}));};
 assert.equal(await inspectStoredRoomFile(storage,file,fetcher),true);assert.ok(canceled);assert.ok(bytes<=8192);
});
test('Truncated uploads and disguised file types are rejected',async()=>{
 await assert.rejects(()=>inspectStoredRoomFile({...storage,info:async()=>({data:{size:1}})},file),/incomplete/);
 await assert.rejects(()=>inspectStoredRoomFile(storage,file,async()=>new Response(new Uint8Array(4096))),/declared format/);
 await assert.rejects(()=>inspectStoredRoomFile(storage,file,async()=>new Response('%PDF-1.7')),/declared format/);
});
