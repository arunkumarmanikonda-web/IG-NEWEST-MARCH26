import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {isolatedTask} from '../lib/isolated-task.mjs';
import {inspectArchive} from '../supabase/functions/ig-room-broker/archive-check.mjs';
import {sessionCookie,readSession} from '../lib/gullu-session.mjs';
import {contentSecurityPolicy} from '../lib/content-security.mjs';
import {answerFromPassages} from '../lib/gullu.mjs';
import {verifyGulluClaims} from '../lib/gullu-verification.mjs';
import {evidenceSlots,compareEvidence} from '../lib/identity-evidence.mjs';
const response=x=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(x)}]}]});
const config={mode:'enabled',settings:{model:'test'},secrets:{api_key:'synthetic'}};
test('Archive parsing is isolated and malformed data cannot block the request',async()=>{
 const data=zipSync({'word/document.xml':strToU8('<document>Approved text</document>'),'ignore.txt':strToU8('not extracted')});
 const result=await isolatedTask('archive-worker.mjs','extractArchive',[data,'text']);
 assert.deepEqual(Object.keys(result),['word/document.xml']);
 await assert.rejects(isolatedTask('archive-worker.mjs','extractArchive',[new Uint8Array([1,2,3]),'text']));
 await assert.rejects(isolatedTask('archive-worker.mjs','extractArchive',[data,'text'],{timeout:1}),/time limit/);
});
test('Upload validates OOXML contents, rejects renamed ZIPs, macros, executable files and traversal',async()=>{
 const check=(name,entries)=>{const bytes=zipSync(Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,strToU8(v)])));return inspectArchive(name,bytes.length,async(a,b)=>bytes.slice(a,b+1));};
 const document={'[Content_Types].xml':'types','_rels/.rels':'rels','word/document.xml':'document'};
 assert.equal(await check('file.docx',document),true);
 await assert.rejects(check('file.xlsx',document),/does not match/);
 for(const path of ['../bad.txt','word/vbaProject.bin','payload.exe','word/embeddings/ole.bin'])await assert.rejects(check('file.docx',{...document,[path]:'unsafe'}));
});
test('Chat cookies reject modifications, expiry, future tokens and other sessions',()=>{
 const id='11111111-1111-1111-1111-111111111111',key='synthetic',now=1794916800000;
 const token=sessionCookie(id,key,now);
 assert.equal(readSession(token,key,now+10),id);
 assert.equal(readSession(token.replace('11111111','22222222'),key,now),null);
 assert.equal(readSession(token,key,now+86400001),null);
 assert.equal(readSession(token,key,now-1),null);
 assert.equal(readSession(token,'other',now),null);
});
test('Production CSP permits only nonced scripts, with explicit checkout and storage connections',()=>{
 const csp=contentSecurityPolicy('random',{supabaseUrl:'https://storage.supabase.co'});
 assert.match(csp,/nonce-random/);assert.match(csp,/frame-ancestors 'none'/);
 assert.doesNotMatch(csp.split(';')[1],/unsafe-inline|unsafe-eval/);
 assert.match(csp,/https:\/\/storage.supabase.co/);
});
test('Gullu rejects a financial promise despite a matching number and source id',async()=>{
 const candidates=[{title:'Investment terms',text:'The target is 100. Returns are not guaranteed.',href:'/opportunities/example'}];
 let checks=0;
 const result=await answerFromPassages({question:'Is my return guaranteed?',history:[],candidates,config,fetcher:async(_,r)=>{
  if(JSON.parse(r.body).text.format.name==='gullu_claim_check'){checks++;return response({checks:[{index:0,supported:false,evidence:[]}]});}
  return response({mode:'grounded',paragraphs:[{text:'We guarantee a return of 100.',ids:[0]}]});
 }});
 assert.equal(checks,1);assert.doesNotMatch(result.answer,/We guarantee/);
});
test('A verifier must provide exact evidence from the cited subject for every paragraph',async()=>{
 const pieces=[{text:'This property has 50 rooms.',ids:[0]}],candidates=[{title:'Hotel A',text:'50 rooms'}];
 for(const result of [{checks:[]},{checks:[{index:0,supported:true,evidence:[{id:1,quote:'50 rooms'}]}]},{checks:[{index:0,supported:true,evidence:[{id:0,quote:'500 rooms'}]}]}])assert.equal(await verifyGulluClaims({pieces,candidates,config,fetcher:async()=>response(result)}),false);
});
test('International entities use appropriate evidence and remain subject to manual verification',()=>{
 assert.deepEqual(evidenceSlots({kind:'organisation'}),['registration','authority']);
 assert.deepEqual(evidenceSlots({kind:'international_individual'}),['passport']);
 assert.deepEqual(evidenceSlots({kind:'company'}),['incorporation','resolution']);
 assert.equal(compareEvidence({kind:'organisation',legal_name:'Example LLP'},'registration','Example LLP').status,'review');
});
