import test from 'node:test';
import assert from 'node:assert/strict';
import {publicDocuments,terms,answerFromPassages,rankPassages} from '../lib/gullu.mjs';
import {leadershipAnswer,hasInternalEvidenceLanguage} from '../lib/gullu-leadership.mjs';
import {retrieveGulluRows} from '../lib/gullu-retrieval.mjs';
import {gulluReply} from '../lib/gullu-engine.mjs';

const people=[
 {kind:'person',slug:'arun-manikonda',title:'Arun Manikonda',summary:'A published leadership profile.',public_data:{job_title:'Founder & Managing Director',private_notes:'do not read'}},
 {kind:'person',slug:'pavan-manikonda',title:'Pavan Manikonda',summary:'A published leadership profile.',public_data:{job_title:'Executive Director'}},
 {kind:'person',slug:'amit-jhingan',title:'Amit Jhingan',summary:'A published leadership profile.',public_data:{job_title:'President · Real Estate'}},
];
const docs=publicDocuments({records:people});

test('everyday leadership questions use the published role, including role-only profiles',()=>{
 for(const question of ['who is the boss at india gully',"who’s India Gully’s boss?",'who runs India Gully','who is in charge','who is the head of your company','who is the top executive','who is your founder','who is your managing director','WHO IS YOU MANAGING DIRECTOR']){
  const reply=leadershipAnswer(question,docs);assert.equal(reply?.answer,'Arun Manikonda is our Founder and Managing Director.',question);
  assert.deepEqual(reply.sources,[{title:'Arun Manikonda',href:'/leadership/arun-manikonda'}]);
 }
 assert.match(leadershipAnswer('India Gully ke boss kaun hain?',docs,'Hinglish').answer,/Arun Manikonda hamare Founder and Managing Director/);
 assert.match(leadershipAnswer('आपके बॉस कौन हैं?',docs,'Hindi').answer,/संस्थापक और प्रबंध निदेशक/);
 assert.match(leadershipAnswer('who is your executive director',docs).answer,/Pavan Manikonda is our Executive Director/);
 assert.equal(leadershipAnswer('Tell me about your leadership',docs).sources.length,3);
 assert.ok(terms('who is your boss').includes('director'));
 assert.ok(rankPassages(docs,'Who is your captain?',[],'/').some(p=>p.title==='Arun Manikonda'&&p.text==='Role · Founder & Managing Director'));
 assert.ok(rankPassages(docs,'Who is your captain?',[],'/').every(p=>p.kind==='person'));
 assert.equal(terms('head office address').includes('director'),false);
 assert.doesNotMatch(JSON.stringify(docs),/private_notes|do not read/);
});

test('leadership shortcuts do not invent ownership, a CEO title, outside-company roles or historical positions',()=>{
 for(const question of ['Who owns India Gully?','Who is your CEO?','Who is the boss at CBRE?','My boss needs funds','Who is your founder and what is his salary?'])assert.equal(leadershipAnswer(question,docs),null,question);
 const edited=publicDocuments({records:[{...people[0],public_data:{job_title:'Founder'}}]});
 assert.equal(leadershipAnswer('who is your founder',edited).answer,'Arun Manikonda is our Founder.');
 assert.equal(leadershipAnswer('who is your boss',edited),null);
 const former=publicDocuments({records:[{...people[0],summary:'Former Managing Director.',public_data:{}}]});
 assert.equal(leadershipAnswer('who is your boss',former),null);
 const ambiguous=publicDocuments({records:[people[0],{...people[1],public_data:{job_title:'Managing Director'}}]});
 assert.equal(leadershipAnswer('who is the boss',ambiguous),null);
});

test('published leadership has its own unfiltered retrieval group and survives unrelated page volume',async()=>{
 const calls=[];
 function query(){const call={};calls.push(call);return {
  select(){return this;},in(field,kinds){assert.equal(field,'kind');call.kinds=kinds;return this;},
  not(){return this;},or(filter){call.filter=filter;return this;},order(){return this;},
  async limit(n){call.limit=n;return {data:call.kinds.includes('person')?people:Array.from({length:30},(_,i)=>({kind:'page',slug:'page-'+i,title:'General page'})).slice(0,n)};},
 };}
 const client={from(view){assert.equal(view,'ig_public_content');return query();}};
 const rows=await retrieveGulluRows(client,(c,columns)=>c.from('ig_public_content').select(columns).in('kind',['opportunity']),'who is the boss at india gully',[{question:'love you',answer:'Good vibes!',sources:[]}],'/');
 const leadership=calls.find(c=>c.kinds[0]==='person');assert.equal(leadership.filter,undefined);assert.equal(leadership.limit,50);
 assert.ok(calls.every(c=>!c.kinds.includes('person')||c.kinds.length===1));
 assert.equal(leadershipAnswer('who is the boss at india gully',publicDocuments({records:rows})).sources[0].href,'/leadership/arun-manikonda');
});

test('the reported hello / whats up / love you / boss sequence needs no model calls or repeated prompts',async()=>{
 const history=[];let reads=0,calls=0;
 for(const question of ['hello','whats up','love you','who is the boss at india gully']){
  const {reply}=await gulluReply({question,history,loadDocuments:async()=>{reads++;return docs;},loadConfig:async()=>null,fetcher:async()=>{calls++;throw Error('No model needed');}});
  history.push({question,answer:reply.answer,sources:reply.sources.map(s=>s.href)});
 }
 assert.equal(reads,1);assert.equal(calls,0);
 assert.match(history[0].answer,/What’s on your mind/);
 assert.doesNotMatch(history[1].answer,/mind|\?/);
 assert.doesNotMatch(history[2].answer,/mind|\?|love you too/i);
 assert.equal(history[3].answer,'Arun Manikonda is our Founder and Managing Director.');
});

test('internal evidence commentary is rejected before a customer sees it',async()=>{
 const texts=['The evidence does not specify who exactly is the boss.','The supplied context does not mention any leadership.','This is not included in the provided evidence.'];
 for(const answer of texts){assert.equal(hasInternalEvidenceLanguage(answer),true);
  let verified=false;
  const result=await answerFromPassages({question:'Tell me about the firm',history:[],candidates:[{title:'About',href:'/about',text:'India Gully is a brand.',interest:'General enquiry'}],config:{mode:'enabled',settings:{model:'test'},secrets:{api_key:'test'}},fetcher:async(_,req)=>{
   if(JSON.parse(req.body).text.format.name==='gullu_claim_check')verified=true;
   return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({mode:'grounded',paragraphs:[{text:answer,ids:[0]}]})}]}]});
  }});
  assert.equal(verified,false);assert.equal(hasInternalEvidenceLanguage(result.answer),false);assert.doesNotMatch(result.answer,/filings|statutory|exactly is the boss/);
 }
 assert.equal(hasInternalEvidenceLanguage('Our leadership page identifies Arun as Founder and Managing Director.'),false);
 assert.equal(hasInternalEvidenceLanguage('The evidence in our published brief is the cited order.'),false);
});
