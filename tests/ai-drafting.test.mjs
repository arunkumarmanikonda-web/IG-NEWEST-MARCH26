import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialInput,checkEditorialDraft,generateEditorialDraft} from '../lib/ai-drafting.mjs';
const context=editorialInput({kind:'article',brief:'Prepare an introduction to our services.',facts:'India Gully provides feasibility studies.',sources:'Approved public services page',publicOnly:true});
const draft={title:'Feasibility studies',summary:'Our feasibility work.',body:'India Gully provides feasibility studies.',seo_title:'Feasibility studies | India Gully',seo_description:'Explore India Gully feasibility studies.',keywords:['feasibility'],ad_headlines:['Feasibility studies'],ad_descriptions:['Explore our feasibility services.'],creative_brief:'Conceptual editorial illustration; no real project depicted.',claims:[{text:'India Gully provides feasibility studies.',factIds:['F1']}],review_questions:[]};
const config={mode:'enabled',secrets:{api_key:'test-not-a-real-key'},settings:{model:'gpt-4.1-mini',max_output_tokens:1500}};
test('editorial inputs require explicit public approval and bounded verified source material',()=>{
 for(const change of [{publicOnly:false},{facts:''},{facts:'a'.repeat(12001)},{sources:'x'},{kind:'data-room'},{brief:'x'}])assert.throws(()=>editorialInput({kind:'article',brief:'A public service introduction',facts:'A verified fact.',sources:'Public source reference',publicOnly:true,...change}));
 assert.deepEqual(context.facts.map(f=>f.id),['F1']);
});
test('AI requests contain only approved editorial context, disable storage, and expose no tools',async()=>{
 let sent;
 const result=await generateEditorialDraft(config,context,async(url,request)=>{sent=JSON.parse(request.body);assert.equal(url,'https://api.openai.com/v1/responses');return {ok:true,json:async()=>({status:'completed',id:'test-response',usage:{input_tokens:10,output_tokens:20},output:[{content:[{type:'output_text',text:JSON.stringify(draft)}]}]})};});
 assert.equal(sent.store,false);assert.equal(sent.tools,undefined);assert.equal(sent.text.format.strict,true);assert.deepEqual(JSON.parse(sent.input),context);assert.deepEqual(result.draft,draft);assert.equal(result.usage.output_tokens,20);
});
test('disabled or unconfigured AI cannot incur provider calls',async()=>{
 for(const c of [{...config,mode:'disabled'},{...config,secrets:{}}])await assert.rejects(()=>generateEditorialDraft(c,context,async()=>{assert.fail('Provider must not be called');}));
});
test('AI refusal, truncation, invalid JSON and provider failure cannot produce a draft',async()=>{
 for(const data of [{status:'incomplete'},{status:'completed',output:[{content:[{type:'refusal'}]}]},{status:'completed',output:[{content:[{type:'output_text',text:'bad json'}]}]}])await assert.rejects(()=>generateEditorialDraft(config,context,async()=>({ok:true,json:async()=>data})));
 await assert.rejects(()=>generateEditorialDraft(config,context,async()=>({ok:false,status:429})),/429/);
});
test('unknown source references and overlength SEO or ad copy are rejected before saving',()=>{
 for(const change of [{claims:[{text:'Unsupported claim',factIds:['F9']}]},{ad_headlines:['x'.repeat(31)]},{ad_descriptions:['x'.repeat(91)]},{seo_title:'x'.repeat(61)},{seo_description:'x'.repeat(161)},{body:''}])assert.throws(()=>checkEditorialDraft({...draft,...change},context));
});
