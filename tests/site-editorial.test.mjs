import test from "node:test";
import assert from "node:assert/strict";
import {siteDefaults,validateSection} from "../lib/site-editorial.mjs";
import {parseSiteRecords,sitePrefix} from "../lib/site-cms-records.mjs";
import {practiceUpdate} from "../lib/practice-updates.mjs";

test("all nineteen original website sections survive a stored JSON round trip", () => {
  assert.equal(Object.keys(siteDefaults).length,19);
  for (const [key,value] of Object.entries(siteDefaults)) {
    const records=parseSiteRecords([{slug:sitePrefix+key,body:JSON.stringify(value),version:2,published_version:1}]);
    assert.deepEqual(records[key],{content:value,version:2,live_version:1});
  }
});
test("invalid menu destinations, duplicate sections and corrupt stored records retain safe defaults",()=>{
  const groups=structuredClone(siteDefaults.navigation);
  groups[0].links[0][0]="https://example.org";
  assert.throws(()=>validateSection("navigation",groups));
  assert.throws(()=>validateSection("home-layout",["practices","practices"]));
  assert.deepEqual(parseSiteRecords([{slug:sitePrefix+"home",body:"{"}]),{});
});
test("published property and catalogue campaign drafts use their own practice and public route",()=>{
  for (const [kind,practice,path] of [["opportunity","real-estate","/opportunities/"],["product","horeca","/horeca/products/"]]) {
    const update=practiceUpdate({id:"demo",kind,title:"Sample listing",slug:"sample",summary:"Supplied details."});
    assert.equal(update.practice,practice);
    assert.equal(update.path,path+"sample");
    assert.ok(update.campaign.body.includes("https://indiagully.com"+update.path));
  }
  assert.equal(practiceUpdate({kind:"page",title:"Other page",slug:"page"}),null);
});

import {advertisingEvent} from "../lib/advertising.mjs";
test("ad measurement requires the latest affirmative consent and a matching interest",()=>{
  const input={id:"AW-123456",label:"Enquiry01",practice:"horeca",event:"enquiry",token:"a".repeat(64),granted:true,interests:["horeca"]};
  assert.equal(advertisingEvent(input)[2].send_to,"AW-123456/Enquiry01");
  assert.equal(advertisingEvent({...input,granted:false}),null);
  assert.equal(advertisingEvent({...input,interests:["real-estate"]}),null);
  assert.equal(advertisingEvent({...input,label:""}),null);
  assert.equal(advertisingEvent({...input,token:"client@example.com"}),null);
});
