import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryRequest,inventorySnapshot,inventoryAnswer,readPublicInventory,inventoryPassages,inventoryAbsenceClaim,needsInventory} from '../lib/gullu-inventory.mjs';
import {publicDocuments,answerFromPassages} from '../lib/gullu.mjs';
import {gulluReply} from '../lib/gullu-engine.mjs';
import {leadershipAnswer} from '../lib/gullu-leadership.mjs';

const rows=[
 {id:'1',kind:'opportunity',slug:'alphathum',title:'Alphathum Offices, Noida',public_data:{city:'Noida',asset_class:'Office',transaction_type:'Sale',private_notes:'Private must stay private'}},
 {id:'2',kind:'opportunity',slug:'park-plaza',title:'Park Plaza Ludhiana',public_data:{city:'Ludhiana',asset_class:'City hotel',transaction_type:'Corporate insolvency resolution'}},
 {id:'3',kind:'opportunity',slug:'prism-tower',title:'Prism Tower',public_data:{city:'Gurugram',asset_class:'Mixed-use commercial & hospitality',reference:'Portfolio reference'}},
 {id:'4',kind:'retail_space',slug:'cyber-park',title:'Unitech Cyber Park',public_data:{city:'Gurugram',formats:'Office'}},
 {id:'5',kind:'retail_requirement',slug:'hotel-expansion',title:'Hotel brand expansion',public_data:{city:'Noida',formats:'Hotel'}},
 {id:'6',kind:'opportunity',slug:'greater-noida-hotel',title:'Hotel in Greater Noida',public_data:{city:'Greater Noida',asset_class:'City hotel',transaction_type:'Sale'}},
 {id:'7',kind:'product',slug:'hotel-linen',title:'Hotel linen in Noida',public_data:{city:'Noida',category:'Hotel supplies'}},
 {id:'8',kind:'opportunity',status:'draft',slug:'private-hotel',title:'Private hotel in Noida',public_data:{city:'Noida',asset_class:'Hotel'}},
];
const snapshot=inventorySnapshot(rows);
const people=[
 {kind:'person',slug:'arun-manikonda',title:'Arun Manikonda',public_data:{job_title:'Founder & Managing Director'}},
 {kind:'person',slug:'pavan-manikonda',title:'Pavan Manikonda',public_data:{job_title:'Executive Director'}},
 {kind:'person',slug:'amit-jhingan',title:'Amit Jhingan',public_data:{job_title:'President · Real Estate'}},
];

test('location and property type search handles everyday wording and a trailing slash',()=>{
 for(const q of ['you have hotels in noida\\','Do you have hotels in Noida?','show me Noida hotels','Noida mein hotel hai?','नोएडा में होटल है?']){
  assert.equal(needsInventory(q),true);assert.deepEqual(inventoryRequest(q),{asset:'hotel',city:'Noida',purpose:null},q);
  const reply=inventoryAnswer(q,snapshot);assert.match(reply.answer,/don’t see a current hotel listing in Noida on our public site/);assert.match(reply.answer,/buy\/invest, lease a hotel, or book a stay/);
  assert.equal(reply.sources.length,0);assert.doesNotMatch(reply.answer,/Alphathum|Greater Noida|brand|Private|operator|standards/);
 }
 assert.equal(inventoryRequest('hotels in Mysuru for lease').city,'Mysuru');
 assert.equal(inventoryRequest('hotels in New York').city,'New York');
 assert.match(inventoryAnswer('Noida mein hotel hai?',snapshot,[],'Hinglish').answer,/Aap hotel kharidna/);
 assert.match(inventoryAnswer('नोएडा में होटल है?',snapshot,[],'Hindi').answer,/ठहरने की बुकिंग/);
});

test('published matches distinguish offered space, room bookings, portfolio references and exact cities',()=>{
 const ludhiana=inventoryAnswer('hotels in Ludhiana for sale',snapshot);assert.match(ludhiana.answer,/Park Plaza Ludhiana/);assert.equal(ludhiana.sources[0].href,'/opportunities/park-plaza');assert.match(ludhiana.answer,/availability and terms need confirmation/);
 const offices=inventoryAnswer('offices in Noida for sale',snapshot);assert.match(offices.answer,/Alphathum/);assert.doesNotMatch(offices.answer,/hotel/i);
 const gurgaon=inventoryAnswer('hotels in Gurgaon',snapshot);assert.match(gurgaon.answer,/portfolio reference.*not a current offer/);assert.equal(gurgaon.sources[0].href,'/opportunities/prism-tower');
 const leasing=inventoryAnswer('office for lease in Gurgaon',snapshot);assert.match(leasing.answer,/Unitech Cyber Park/);assert.doesNotMatch(leasing.answer,/Prism/);
 const stay=inventoryAnswer('book a hotel stay in Noida',snapshot);assert.match(stay.answer,/can’t check room bookings or live room availability/);assert.equal(stay.sources.length,0);
 assert.equal(inventoryAnswer('hotels in Noida',{complete:false,items:[]}),null);
 assert.doesNotMatch(JSON.stringify(snapshot),/private_notes|Private must|Private hotel|Hotel linen/);
});

test('follow-up answers preserve city and purpose while topic switches clear the old brief',()=>{
 const history=[{question:'you have hotels in noida\\'},{question:'love u'}];
 assert.deepEqual(inventoryRequest('buy',history),{asset:'hotel',city:'Noida',purpose:'buy'});
 history.push({question:'buy'});
 assert.deepEqual(inventoryRequest('what about Ludhiana',history),{asset:'hotel',city:'Ludhiana',purpose:'buy'});
 assert.match(inventoryAnswer('what about Ludhiana',snapshot,history).answer,/Park Plaza/);
 assert.equal(inventoryRequest('what about Ludhiana',[...history,{question:'who is your founder'}]),null);
 assert.equal(inventoryAnswer('hotel in Noida under 50 crore',snapshot),null);
 assert.equal(inventoryAnswer('hotels in Ludhiana',snapshot,[{question:'hotels in Noida under 50 crore'}]),null);
 assert.equal(inventoryAnswer('hotels in Ludhiana',snapshot,[{question:'hotels in Noida'},{question:'budget is 50 crore'}]),null);
 for(const q of ['hotels in Noida with 50 rooms','hotels in Noida or Delhi','hotels near Noida','hotels in Noida not Delhi','hotels in Noida with a pool','hotels in Noida for sale and lease','hotel development advice in Noida','hotel supplies in Noida','who owns hotels in Noida','operating hotels in Noida'])assert.equal(inventoryAnswer(q,snapshot),null,q);
 assert.equal(needsInventory('what about Ludhiana',history),true);
});

test('inventory reads all public pages and never treats a failed later page as no matches',async()=>{
 const records=Array.from({length:251},(_,i)=>({...rows[0],id:String(i).padStart(4,'0'),slug:'office-'+i}));
 records[250]={...rows[1],id:'0250',public_data:{city:'Noida',asset_class:'Hotel',transaction_type:'Sale'}};
 let calls=0;
 const client=fail=>({from(view){assert.equal(view,'ig_public_content');let after='';return {
  select(columns){assert.doesNotMatch(columns,/body|private|email/);return this;},in(field,kinds){assert.equal(field,'kind');assert.deepEqual(kinds,['opportunity','retail_space','retail_requirement']);return this;},limit(){return this;},order(key){assert.equal(key,'id');return this;},gt(key,v){after=v;return this;},
  then(resolve){calls++;resolve(fail&&after?{error:{message:'Offline'},data:null}:{data:records.filter(r=>!after||r.id>after).slice(0,250),error:null});},
 };}});
 const result=await readPublicInventory(client(false));assert.equal(calls,2);assert.equal(result.items.length,251);assert.match(inventoryAnswer('hotels in Noida',result).answer,/Park Plaza/);
 await assert.rejects(readPublicInventory(client(true)),/inventory unavailable/);
});

test('who else lists remaining leaders once and does not invent additional staff',()=>{
 const docs=publicDocuments({records:people}),history=[{question:'who is the boss',sources:['/leadership/arun-manikonda']}];
 const more=leadershipAnswer('who else',docs,'English',history);assert.match(more.answer,/Pavan Manikonda/);assert.match(more.answer,/Amit Jhingan/);assert.doesNotMatch(more.answer,/Arun|bring the best/);
 history.push({question:'who else',sources:more.sources});
 assert.match(leadershipAnswer('who else',docs,'English',history).answer,/covered the leadership profiles/);
 assert.equal(leadershipAnswer('who else',docs,'English',[...history,{question:'you have hotels in Noida',sources:[]}]),null);
});

test('the exact reported conversation answers from published roles and a complete inventory without model calls',async()=>{
 const history=[],docs=publicDocuments({records:[...rows,...people]});let modelCalls=0;
 for(const question of ['hi','who is the boss','who else','love u','you have hotels in noida\\']){
  const {reply,diagnostics}=await gulluReply({question,history,loadDocuments:async()=>({documents:docs,inventory:snapshot}),loadConfig:async()=>null,fetcher:async()=>{modelCalls++;throw Error('Unexpected model call');}});
  history.push({question,answer:reply.answer,sources:reply.sources});
  if(question.includes('noida'))assert.equal(diagnostics.path,'inventory_search');
 }
 assert.equal(modelCalls,0);assert.match(history.at(-1).answer,/Noida/);assert.doesNotMatch(history.at(-1).answer,/expertise|brands|operator search/);
});

test('model answers cannot claim inventory-wide absence from practice or individual-listing passages',async()=>{
 const text="We don't have hotels listed specifically in Noida, but our expertise covers helping owners turn sites into hotel propositions.";
 assert.equal(inventoryAbsenceClaim(text),true);
 for(const s of ['No hotels are listed in Noida.','We have no properties in Noida.','Our listings do not include any offices in Noida.'])assert.equal(inventoryAbsenceClaim(s),true,s);
 assert.equal(inventoryAbsenceClaim('The listing does not guarantee a return.'),false);
 const candidates=[{title:'Hospitality',href:'/practices/hospitality',text:'We help owners develop hotels.',interest:'Hospitality'}];let calls=0;
 const result=await answerFromPassages({question:'hotels in Noida under 50 crore',history:[],candidates,config:{mode:'enabled',settings:{model:'test'},secrets:{api_key:'test'}},fetcher:async()=>{calls++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({mode:'grounded',paragraphs:[{text,ids:[0]}]})}]}]});}});
 assert.equal(calls,1);assert.doesNotMatch(result.answer,/don't have hotels|expertise/);
 assert.ok(inventoryPassages(snapshot,'hotels in Gurgaon').some(p=>/Portfolio reference, not a current offer/.test(p.text)));
 assert.ok(inventoryPassages(snapshot,'hotels in Noida').some(p=>/Brand requirement, not space offered/.test(p.text)));
 assert.ok(inventoryPassages(inventorySnapshot(Array.from({length:20},(_,i)=>({...rows[1],slug:'hotel-'+i}))),'hotel').length<=8);
});
