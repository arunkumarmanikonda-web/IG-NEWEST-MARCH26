import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareerDraft} from '../lib/career-drafting.mjs';
const config={mode:'enabled',secrets:{api_key:'fixture'},settings:{model:'fixture'}};
const input={title:'Procurement Manager',expectations:'Manage supplier negotiations'};
const fields={slug:'procurement-manager',department:'Procurement',location:'India',work_mode:'onsite',employment_type:'full-time',summary:'Manage procurement for hospitality assignments.',description:'Manage hospitality procurement from the initial requirement through supplier delivery.',responsibilities:'Negotiate with suppliers.',requirements:'Supplier negotiation experience.',salary_text:'',closes_at:''};
test('role and expectations generate a validated, unpublished vacancy',async()=>{
  const job=await createCareerDraft(input,config,async(url,options)=>{
    const body=JSON.parse(options.body);
    assert.deepEqual(JSON.parse(body.input),input);
    assert.equal(body.store,false);
    return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({...fields,status:'published'})}]}]});
  });
  assert.equal(job.status,'draft');
  assert.equal(job.title,input.title);
  assert.equal(job.closes_at,null);
});
test('a role alone is sufficient and invalid output is rejected',async()=>{
  let called=false;
  await assert.rejects(createCareerDraft({title:input.title},config,async()=>{called=true;return Response.json({status:'completed',output:[]});}),/did not fit/);
  assert.equal(called,true);
  await assert.rejects(createCareerDraft({title:'x'},config),/role title/);
});
