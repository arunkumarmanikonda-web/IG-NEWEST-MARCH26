import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {processingExtension,signedStorageURL,validateProcessingReport,processPrivateFile} from '../lib/private-file-engine.mjs';
import {processingStorageRequest} from '../supabase/functions/ig-room-broker/process-worker.mjs';
const base='https://project.supabase.co';
const pdf=Buffer.from('%PDF-1.6\nSynthetic test');
const report={scan:'clean',engine:'ClamAV 1.4/test',sha256:'a'.repeat(64),preview:true,preview_bytes:pdf.length,preview_sha256:createHash('sha256').update(pdf).digest('hex'),pages:1};
test('processing rejects unsafe formats, foreign storage URLs and incomplete evidence',()=>{
 assert.equal(processingExtension('sheet.XLSX'),'xlsx');
 assert.throws(()=>processingExtension('attack.exe'));
 for(const url of ['https://other.example/storage/v1/object/sign/ig-data-rooms/a','https://project.supabase.co/storage/v1/object/public/ig-data-rooms/a','http://project.supabase.co/storage/v1/object/sign/ig-data-rooms/a'])assert.throws(()=>signedStorageURL(url,base));
 for(const r of [{scan:'clean'},{...report,preview_bytes:20971521},{...report,pages:0},{...report,scan:'infected'}])assert.throws(()=>validateProcessingReport(r));
});
function harness(changes={}){
 const events=[];let command=0;
 const sandbox={updateNetworkPolicy:async p=>{events.push(['network',p]);if(changes.firewallFails&&p==='deny-all')throw new Error('firewall');},writeFiles:async files=>events.push(['files',files.map(f=>f.path)]),runCommand:async()=>{events.push(['command',++command]);return {exitCode:0};},readFile:async({path})=>Readable.from([path.endsWith('result.json')?Buffer.from(JSON.stringify(changes.report||report)):(changes.pdf||pdf)])};
 const broker=async(action)=>{events.push(['broker',action]);return {url:base+'/storage/v1/object/'+(action==='source'?'sign/':'upload/sign/')+'ig-data-rooms/test?token=short-lived'};};
 const args={job:{name:'Spreadsheet.xlsx',bytes:100,needs_preview:true},sandbox,broker,projectURL:base,converter:'trusted script',fetcher:async(url,init)=>{events.push(['upload',url,init.method]);return {ok:true};}};
 return {events,args};
}
test('network is denied before conversion and preview integrity precedes attachment',async()=>{
 const {events,args}=harness();await processPrivateFile(args);
 assert.ok(events.findIndex(e=>e[0]==='network'&&e[1]==='deny-all')<events.findIndex(e=>e[0]==='command'&&e[1]===2));
 assert.ok(events.findIndex(e=>e[0]==='upload')<events.findIndex(e=>e[0]==='broker'&&e[1]==='finish'));
 assert.equal(events.filter(e=>e[0]==='upload').length,1);
});
test('firewall failure and checksum mismatch cannot attach a preview',async()=>{
 for(const options of [{firewallFails:true},{pdf:Buffer.from('wrong')}]){
 const {events,args}=harness(options);await assert.rejects(processPrivateFile(args));
 assert.equal(events.some(e=>e[0]==='broker'&&e[1]==='finish'),false);
 assert.equal(events.some(e=>e[0]==='upload'),false);
 }
});
test('infected originals never request or upload a preview',async()=>{
 const {events,args}=harness({report:{...report,scan:'infected',preview:false}});
 assert.equal((await processPrivateFile(args)).pending_review,1);
 assert.equal(events.some(e=>e[0]==='upload'),false);
 assert.equal(events.some(e=>e[0]==='broker'&&e[1]==='preview_prepare'),false);
});
test('storage worker authenticates the exact job before accessing privileged storage',async()=>{
 let storage=false;
 await assert.rejects(processingStorageRequest({action:'process_source'},async()=>{throw new Error('invalid lease');},()=>{storage=true;}));
 assert.equal(storage,false);
 let key;
 const result=await processingStorageRequest({action:'process_source',object_key:'attacker-chosen'},async()=>({object_key:'authorised-file'}),()=>({createSignedUrl:async k=>{key=k;return {data:{signedUrl:'url'}};}}));
 assert.equal(key,'authorised-file');assert.equal(result.url,'url');
});
