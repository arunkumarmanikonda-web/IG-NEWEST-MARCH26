import test from "node:test";
import assert from "node:assert/strict";
import { residencesDefaults } from "../lib/residences.mjs";
import { buildSearchIndex, filterSearch } from "../lib/site-search.mjs";
import { publicDocuments, isPublicPath, rankPassages } from "../lib/gullu.mjs";

const active = {...residencesDefaults, enabled:true, highlights:["Approved project highlight"]};
const source = config => publicDocuments({residencesConfig:config}).find(row => row.href === "/residences");
const search = config => buildSearchIndex([], [], config).find(row => row.href === "/residences");

test("Residences discovery remains absent while disabled, scheduled, expired or invalid", () => {
  for (const config of [
    null,
    residencesDefaults,
    {...active, startsAt:new Date(Date.now()+86400000).toISOString()},
    {...active, endsAt:new Date(Date.now()-86400000).toISOString()},
    {...active, ctaHref:"//outside.example"},
  ]) {
    assert.equal(source(config), undefined);
    assert.equal(search(config), undefined);
  }
});

test("published active launch becomes searchable and grounds Gullu in approved copy", () => {
  const row = search(active);
  assert.equal(row.title, "India Gully Residences");
  assert.equal(row.summary, active.description);
  assert.equal(filterSearch(buildSearchIndex([],[],active),{q:"Sohna residences"})[0].href,"/residences");
  const doc = source(active);
  assert.ok(doc.chunks.includes("Location · Sector 35, Sohna"));
  assert.ok(doc.chunks.includes("Approved project highlight"));
  assert.equal(rankPassages([doc],"Tell me about India Gully Residences",[],"/")[0].href,"/residences");
  assert.equal(JSON.stringify(doc).includes("startsAt"),false);
});

test("homepage display preference does not hide an otherwise active dedicated project page", () => {
  assert.ok(search({...active,homepage:false}));
  assert.ok(source({...active,homepage:false}));
});

test("Gullu does not cite unpublished CMS configuration or invented Residences subpages", () => {
  const records=[{kind:"page",slug:"website-editor-residences-launch",title:"Confidential launch",body:JSON.stringify(active),status:"draft"}];
  assert.equal(publicDocuments({records}).some(row=>row.title==="Confidential launch"),false);
  assert.equal(isPublicPath("/residences"),true);
  for (const path of ["/residences/units","/residences?preview=1","/admin/residences","//indiagully.com/residences"]) assert.equal(isPublicPath(path),false);
});
