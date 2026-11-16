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

test("only current approved passages can appear in an AI answer",async()=>{
  const config={mode:"enabled",settings:{model:"model"},secrets:{api_key:"test"}};
  const candidates=rankPassages(docs,"Jaisalkot keys",[],"/");
  const ask=ids=>answerFromPassages({question:"Jaisalkot keys",history:[],candidates,config,
    fetcher:async (url,req)=>{
      const body=JSON.parse(req.body);
      assert.equal(body.store,false);
      assert.equal(body.tools,undefined);
      return Response.json({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify({ids,answer:"malicious invention"})}]}]});
    }});
  assert.match((await ask([0])).answer,/Keys · 50/);
  assert.doesNotMatch((await ask([99])).answer,/malicious/);
  assert.match((await ask([])).answer,/couldn’t confirm/);
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
