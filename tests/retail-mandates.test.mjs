import test from "node:test";
import assert from "node:assert/strict";
import {contentPath} from "../lib/content-routes.mjs";
import {intakeContent} from "../lib/content-intake.mjs";
import {intakeSchema,checkIntakeResult} from "../lib/intake.mjs";
import {combineUnitEvidence,enquiryMessage} from "../lib/retail-mandates.mjs";
import {reconcileMergedFacts} from "../lib/intake-sections.mjs";
const unit={unit:"G07",floor:"Ground",area:"800 sq ft",basis:"Carpet",zone:"F&B",status:"Available",source:"TEXT",excerpt:"G07: 800 sq ft carpet, available for F&B."};
test("retail intake produces different public records and unit enquiry context",()=>{
 for(const kind of ["retail_space","retail_requirement"]){
  const context={kind,files:[]}, fields=kind==="retail_space"?{city:"Pune"}:{formats:"Café",floors:"Ground",area_range:"800–1000 sq ft"};
  const draft={title:"Test mandate",summary:"Details",body:"Mandate details.",fields,evidence:Object.entries(fields).map(([field,value])=>({field,value,source:"TEXT",excerpt:value})),review_questions:[],creative_brief:"",...(kind==="retail_space"?{units:[unit]}:{})};
  assert.equal("units" in intakeSchema(context).properties,kind==="retail_space");
  const record={id:"12345678-2222",kind,version:1,public_data:{}};
  const saved=intakeContent({draft:checkIntakeResult(draft,context)},record);
  assert.equal(saved.public_data.formats,fields.formats);
  assert.equal(contentPath({...record,...saved}),"/retail-leasing/"+(kind==="retail_space"?"spaces":"requirements")+"/test-mandate-12345678");
  if(kind==="retail_space"){assert.equal(saved.public_data.units[0].status,"Available");assert.equal(saved.public_data.units[0].excerpt,undefined);assert.match(enquiryMessage({...record,...saved},unit),/G07, Ground/);}
 }
});
test("multi-file unit schedules preserve omitted units and withhold conflicting status",()=>{
 const groups=[{parts:[{draft:{units:[unit]}}]},{parts:[{draft:{units:[{...unit,status:"Leased"},{...unit,unit:"G09"}]}}]}];
 const d=reconcileMergedFacts({fields:{},evidence:[],units:[],review_questions:[]},groups);
 const rows=combineUnitEvidence(d.units,[]);
 assert.equal(rows.length,2);assert.equal(rows[0].status,"To confirm");assert.match(d.review_questions[0],/G07/);
});
