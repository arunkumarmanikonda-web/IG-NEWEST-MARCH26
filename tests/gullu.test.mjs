import test from "node:test";
import assert from "node:assert/strict";
import {publicDocuments,rankPassages,answerFromPassages,directAnswer,signTurn,verifiedTurn,isPublicPath,terms} from "../lib/gullu.mjs";

const docs=publicDocuments({
  records:[
    {slug:"jaisalkot",kind:"opportunity",title:"Jaisalkot Heritage Resort",summary:"A heritage resort in Jaisalmer.",public_data:{keys:50,private_notes:"do not use",address:"restricted"}},
    {slug:"new",kind:"article",title:"New development",published_at:"2026-11-01",summary:"Listed in the new edition."},
    {slug:"old",kind:"article",title:"October procurement",published_at:"2026-10-01",summary:"Procurement issues in October."},
    {slug:"draft",kind:"opportunity",status:"draft",title:"Secret listing"},
    {slug:"website-editor-home",kind:"page",title:"Settings",body:"not a public page"},
  ],
  practices:[{slug:"hospitality",title:"Hospitality",intro:"A practice introduction."}],
  policies:{documents:{refunds:{title:"Refund policy",body:"Refunds apply under the accepted order terms."}}},
});

test("knowledge contains only public paths, explicit fields and published sources",()=>{
  assert.deepEqual(docs.find(x=>x.title==="Jaisalkot Heritage Resort").chunks,["A heritage resort in Jaisalmer.","Keys · 50"]);
  assert.ok(!JSON.stringify(docs).match(/Secret listing|restricted|private_notes|Settings/));
  assert.equal(isPublicPath("//outside.com"),false);
  assert.equal(isPublicPath("/account/data-rooms"),false);
  assert.equal(isPublicPath("/practices/real-estate"),true);
  assert.deepEqual(terms('hi,&()%.*'),['hi']);
});

test("current published policy, context and topic ordering come from live records",()=>{
  const historical=[{question:"Jaisalkot Heritage Resort",sources:["/opportunities/jaisalkot"]}];
  const rows=rankPassages(docs,"How many keys does it have?",historical,"/");
  assert.equal(rows[0].text,"Keys · 50");
  assert.equal(rankPassages(docs,"refunds",[],"/")[0].href,"/refunds");
  assert.deepEqual(directAnswer("What are your latest Perspectives?",docs).sources.map(x=>x.href),["/insights/new","/insights/old","/insights"]);
  assert.deepEqual(directAnswer("What practices do you offer?",docs).sources.map(x=>x.title),["Hospitality"]);
});

test("grounded multilingual paragraphs reject unsupported numbers",async()=>{
  const candidates=rankPassages(docs,"Jaisalkot keys",[],"/");
  const ask=(text,ids)=>answerFromPassages({question:"Jaisalkot rooms?",history:[],language:"Hinglish",candidates,config:{mode:"enabled",settings:{model:"model"},secrets:{api_key:"test"}},
    fetcher:async (url,req)=>{const body=JSON.parse(req.body);assert.equal(body.store,false);assert.equal(JSON.parse(body.input).language,"Hinglish");
      return Response.json({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify({mode:"grounded",paragraphs:[{text,ids}]})}]}]});}});
  const i=candidates.findIndex(x=>x.text==="Keys · 50");
  assert.match((await ask("Is resort mein 50 keys hain.",[i])).answer,/50 keys/);
  assert.doesNotMatch((await ask("There are 75 rooms.",[i])).answer,/75/);
  assert.doesNotMatch((await ask("Made up",[999])).answer,/Made up/);
});
test("guest examples switch scope and retain shortlist context",()=>{
  const properties=["One","Two","Three","Four"].map(n=>({kind:"opportunity",title:n,href:"/opportunities/"+n.toLowerCase(),tags:["cirp"],chunks:["Published brief."]}));
  const q="hey gullu tell me a good real estate opportunity a disress one";
  const short=directAnswer(q,properties);assert.equal(short.sources.length,3);
  const h=[{question:q,sources:short.sources.map(s=>s.href)}];
  assert.deepEqual(directAnswer("is that all you have",properties,h).sources.map(s=>s.title),["Four"]);
  assert.deepEqual(directAnswer("i want to all that india gully does",docs,h).sources.map(s=>s.title),["Hospitality"]);
});

test("callbacks reject altered or expired answers and changed conversation ids",()=>{
  const turn={turn_id:"t",session_id:"s",answer:"Published answer",question:"Which?",practice_interest:"General",sources:[{title:"One",href:"/insights/one"}]};
  const receipt=signTurn(turn,"secret",1000);
  assert.equal(verifiedTurn(turn,receipt,"secret",1001),true);
  for (const edit of [{answer:"invented"},{question:"other"},{session_id:"new"},{sources:[{title:"One",href:"/admin"}]}]) {
    assert.equal(verifiedTurn({...turn,...edit},receipt,"secret",1001),false);
  }
  assert.equal(verifiedTurn(turn,receipt,"secret",86402000),false);
});

import {socialReply,acceptsFollowup,conversationLanguage} from "../lib/gullu-conversation.mjs";
test("Arun’s Hinglish greeting, assent, unfinished message and pause stay conversational",()=>{
 let history=[];
 for(const [q,pattern] of [["KYA HORAHA HAI GULLU",/mast hoon/],["HANJI",/Haan ji/],["H,,",/beech mein/],["HMM",/Aaram se/]]){
  const lang=conversationLanguage(q,history,"auto"), reply=socialReply(q,history,lang);
  assert.match(reply.answer,pattern);assert.deepEqual(reply.sources,[]);history.push({question:q,answer:reply.answer});
 }
 assert.equal(socialReply("Hi Gullu, does Park Plaza have a price?",history,"English"),null);
 assert.equal(acceptsFollowup("HANJI",{answer:"Yeh detail confirm nahi hui. Kya team se follow-up karwaun?"}),true);
 assert.equal(acceptsFollowup("yes please",{answer:"Would you like our team to check it for you?"}),true);
 assert.equal(acceptsFollowup("hmm",{answer:"Would you like our team to check it for you?"}),false);
 assert.equal(acceptsFollowup("yes",{answer:"Would you like to see hotels?"}),false);
 assert.equal(conversationLanguage("who is your managing director",history,"Hinglish"),"Hinglish");
 const md=directAnswer("WHO IS YOU MANAGING DIRECTOR",[{kind:"person",title:"Arun Manikonda",href:"/leadership/arun-manikonda",chunks:["Founder and Managing Director."]}],history,"Hinglish");
 assert.equal(md.answer,"Arun Manikonda India Gully ke Managing Director hain.");
});

test("unrecognised conversational phrasing can be answered without fabricating a public source",async()=>{
 const reply=await answerFromPassages({question:"Just popped in to say hello, dost!",history:[],language:"Hinglish",candidates:[],config:{mode:"enabled",settings:{model:"model"},secrets:{api_key:"test"}},
 fetcher:async()=>Response.json({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify({mode:"conversation",paragraphs:[{text:"Arre, achha laga! Aaj ka din kaisa ja raha hai?",ids:[]}]})}]}]})});
 assert.match(reply.answer,/achha laga/);assert.deepEqual(reply.sources,[]);
});
