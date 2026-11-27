import test from 'node:test';
import assert from 'node:assert/strict';
import {publicDocuments,rankPassages,terms} from '../lib/gullu.mjs';
import {factAnswer,resolveSubjects} from '../lib/gullu-context.mjs';
import {socialReply} from '../lib/gullu-conversation.mjs';
import {gulluReply} from '../lib/gullu-engine.mjs';
import {gulluStream,readGulluResponse} from '../lib/gullu-stream.mjs';
const docs=publicDocuments({records:[
 {kind:'opportunity',slug:'jaisalkot',title:'Jaisalkot Heritage Resort',summary:'A heritage resort.',public_data:{keys:50,city:'Jaisalmer',region:'Rajasthan',price_label:'On request'}},
 {kind:'opportunity',slug:'park-plaza',title:'Park Plaza Ludhiana',summary:'A hotel.',public_data:{keys:100,city:'Ludhiana',price_label:'Indicative ₹20 crore'}},
 {kind:'product',slug:'linen',title:'Cloud Linen',summary:'Hotel linen.',public_data:{moq:12,pack_size:'6 pieces',sku:'CL-001',private_notes:'do not use'}},
],practices:[{slug:'funding',title:'Debt & Special Situations',intro:'We help assess debt and equity funding options.'}]});
const history=[{question:'Show me hotels',answer:'Two options',sources:['/opportunities/jaisalkot','/opportunities/park-plaza']}];
test('published fact path resolves an ordinal and clarifies ambiguous references',()=>{
 assert.match(factAnswer('How many keys does the second one have?',docs,history).answer,/Park Plaza Ludhiana: 100 keys/);
 const ambiguous=factAnswer('How many keys does it have?',docs,history);assert.match(ambiguous.answer,/Which one/);assert.doesNotMatch(ambiguous.answer,/100 keys|50 keys/);
 assert.match(factAnswer('Jaisalkot keys?',docs).answer,/50 keys/);
 assert.match(factAnswer('Where is Jaisalkot?',docs).answer,/Jaisalmer, Rajasthan/);
 assert.match(factAnswer('Park Plaza price?',docs).answer,/Current pricing and terms/);
 assert.match(factAnswer('Cloud Linen MOQ?',docs).answer,/12/);
 assert.match(factAnswer('Cloud Linen pack size?',docs).answer,/6 pieces/);
 assert.match(factAnswer('Jaisalkot mein kitne kamre hain?',docs,[],'Hinglish').answer,/50 keys/);
 assert.match(factAnswer('जैसलकोट के कितने कमरे है?',docs,[],'Hindi').answer,/50 कमरे/);
});
test('fact shortcuts never answer a compound, hypothetical or different-subject question',()=>{
 for(const q of ['Where is the airport?','How many rooms with a balcony?','Does Jaisalkot have a guaranteed return?','Jaisalkot price and availability?','Is Jaisalkot price lower than Park Plaza?','Jaisalkot previously had how many keys?','Compare the area of these properties'])assert.equal(factAnswer(q,docs,history),null,q);
 assert.equal(factAnswer('How many keys does the fourth one have?',docs,history),null);
 assert.equal(factAnswer('Jaisalkot MOQ?',docs),null);
 assert.equal(resolveSubjects('I need to raise funds',docs,history).length,0);
});
test('topic changes outrank old sources and ordinal references retrieve the correct subject',()=>{
 assert.equal(rankPassages(docs,'I need to raise funds',history,'/')[0].kind,'practice');
 assert.equal(rankPassages(docs,'Tell me more about the second one',history,'/')[0].title,'Park Plaza Ludhiana');
 assert.ok(terms('Mujhe loan chahiye').includes('debt'));
});
test('banter varies within the chat and a yes preserves the question being asked',()=>{
 const first=socialReply('Hi Gullu',[]);const again=socialReply('Hi Gullu',[{question:'Hi Gullu',answer:first.answer}]);assert.notEqual(first.answer,again.answer);
 const joke=socialReply('tell me a joke',[]);assert.notEqual(joke.answer,socialReply('another joke',[{question:'joke',answer:joke.answer}]).answer);
 assert.match(socialReply('yes',[{answer:'Yes, we can help. How much are you looking to raise?'}]).answer,/How much are you looking to raise/);
 assert.match(socialReply('no',[{answer:'Would you like our team to check it for you?'}]).answer,/No problem/);
 assert.match(socialReply('you misunderstood').answer,/misunderstand/);
 assert.match(socialReply('Are you human?').answer,/AI/);
 assert.equal(socialReply('Hi, is funding guaranteed?'),null);
});
test('social and exact-fact paths make zero model calls',async()=>{
 let lookups=0,modelCalls=0;const common={loadDocuments:async()=>{lookups++;return docs;},loadConfig:async()=>null,fetcher:async()=>{modelCalls++;throw Error('unexpected');}};
 const greeting=await gulluReply({...common,question:'KYA HORAHA HAI GULLU'});assert.equal(greeting.diagnostics.path,'social');assert.equal(lookups,0);
 const fact=await gulluReply({...common,question:'How many keys does Jaisalkot have?'});assert.equal(fact.diagnostics.path,'published_fact');assert.equal(modelCalls,0);assert.equal(lookups,1);
});
test('configuration starts alongside content retrieval rather than after it',async()=>{
 let started=false;const result=await gulluReply({question:'Jaisalkot keys?',loadConfig:async()=>{started=true;return null;},loadDocuments:async()=>{assert.equal(started,true);return docs;}});assert.match(result.reply.answer,/50 keys/);
});
test('stream reports real phases but releases only the completed saved turn',async()=>{
 const seen=[],turn={turn_id:'t',answer:'Checked and saved',sources:[]};
 const response=gulluStream(async progress=>{progress('finding');progress('checking');progress('saving');return turn;});
 assert.match(response.headers.get('cache-control'),/private, no-store/);
 assert.deepEqual(await readGulluResponse(response,x=>seen.push(x)),turn);assert.equal(seen.length,3);
});
test('stream handles split UTF-8, interrupted answers, and a failed save',async()=>{
 const encoder=new TextEncoder(),payload=encoder.encode(JSON.stringify({type:'answer',turn:{turn_id:'t',answer:'नमस्ते',sources:[]}})+'\n');
 const fragmented=new ReadableStream({start(c){for(const byte of payload)c.enqueue(new Uint8Array([byte]));c.close();}});
 assert.equal((await readGulluResponse(new Response(fragmented,{headers:{'Content-Type':'application/x-ndjson'}}))).answer,'नमस्ते');
 await assert.rejects(readGulluResponse(new Response('{"type":"progress","stage":"checking"}\n',{headers:{'Content-Type':'application/x-ndjson'}})),/interrupted/);
 await assert.rejects(readGulluResponse(gulluStream(async()=>{throw Error('private DB error');})),/couldn’t complete/);
 await assert.rejects(readGulluResponse(Response.json({error:'Please start a new chat.'},{status:401})),/new chat/);
});

test('a visitor budget is attributed and independently checked rather than treated as an asset fact',async()=>{
 let checked=false;
 const {answerFromPassages}=await import('../lib/gullu.mjs');
 const candidates=[{title:'Debt & Special Situations',href:'/practices/funding',interest:'Funding',text:'We help assess debt and equity funding options.'}];
 const answer='For your stated budget of 50 crore, we can help assess debt and equity options.';
 const result=await answerFromPassages({question:'My budget is 50 crore',history:[],candidates,config:{mode:'enabled',settings:{model:'test'},secrets:{api_key:'test'}},fetcher:async(_,req)=>{
  const b=JSON.parse(req.body);const verifier=b.text.format.name==='gullu_claim_check';
  if(verifier){checked=true;assert.deepEqual(JSON.parse(b.input).visitorStatements,['My budget is 50 crore']);assert.match(b.instructions,/cannot support claims about a property/);}
  return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(verifier?{checks:[{index:0,supported:true,evidence:[{id:0,quote:candidates[0].text}]}]}:{mode:'grounded',paragraphs:[{text:answer,ids:[0]}]})}]}]});
 }});assert.equal(checked,true);assert.equal(result.answer,answer);
});

test('published compound facts remain on one record and return while configuration is pending', async () => {
 let release;
 const config=new Promise(resolve=>{release=resolve;});
 try {
  const result=await gulluReply({question:'Jaisalkot city and keys?', loadDocuments:async()=>docs,loadConfig:()=>config,fetcher:()=>assert.fail('model call')});
  assert.match(result.reply.answer,/50 keys/);
  assert.match(result.reply.answer,/Jaisalmer, Rajasthan/);
  assert.deepEqual(result.reply.sources.map(s=>s.href),['/opportunities/jaisalkot']);
  assert.equal(factAnswer('Jaisalkot keys and area?',docs),null);
 } finally {release(null);}
});
test('Gullu writes an unsent RFQ from the named published SKU, without inventing quote terms', async () => {
 const result=await gulluReply({question:'Draft an RFQ for Cloud Linen',loadDocuments:async()=>docs,loadConfig:async()=>null,fetcher:()=>assert.fail('model call')});
 assert.match(result.reply.answer,/Draft quote request/);assert.match(result.reply.answer,/CL-001/);
 assert.match(result.reply.answer,/\[quantity\]/);assert.equal(result.reply.sources.length,1);
});
