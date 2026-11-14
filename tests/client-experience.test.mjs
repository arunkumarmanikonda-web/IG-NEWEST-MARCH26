import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, filterSearch } from "../lib/site-search.mjs";
import { selectVisible, publishSelection } from "../lib/bulk-publication.mjs";
import { teaserData } from "../lib/teaser.mjs";
import { listingImageBrief } from "../lib/listing-images.mjs";
import { checkIntakeResult } from "../lib/intake.mjs";
test("global search combines phrase tokens, type, practice and location", () => {
  const rows = buildSearchIndex([
    {
      kind: "opportunity",
      slug: "hotel-a",
      title: "Hotel A",
      summary: "Development property",
      public_data: { city: "Gurugram", sector: "Hospitality" },
    },
    {
      kind: "product",
      slug: "plate",
      title: "White plate",
      summary: "Porcelain",
      public_data: { sku: "IG-001", brand: "Ariane" },
    },
    {
      kind: "opportunity",
      slug: "secret",
      title: "Confidential draft",
      status: "draft",
      public_data: { city: "Delhi" },
    },
  ]);
  assert.equal(
    rows.some((x) => x.title === "Confidential draft"),
    false,
  );
  assert.equal(
    filterSearch(rows, {
      q: "hotel gurugram",
      kind: "opportunity",
      practice: "real-estate",
      location: "Gurugram",
    }).length,
    1,
  );
  assert.equal(
    filterSearch(rows, { q: "IG-001", kind: "product" })[0].href,
    "/horeca/products/plate",
  );
  assert.equal(
    filterSearch(rows, { q: "IG-001", kind: "opportunity" }).length,
    0,
  );
  assert.ok(filterSearch(rows, { q: "feasibility", kind: "practice" }).length);
});
test("filtered checkbox selection retains intentional selections outside a filter", () => {
  assert.deepEqual(selectVisible(["a"], [{ id: "b" }, { id: "c" }], true), [
    "a",
    "b",
    "c",
  ]);
  assert.deepEqual(selectVisible(["a", "b"], [{ id: "b" }], false), ["a"]);
});
test("bulk publication confirms each saved revision and maps unordered server results", async () => {
  const rows = Array.from({length: 52}, (_, i) => ({id: String(i), version: 4, title: "Record " + i}));
  const calls = [], progress = [];
  const results = await publishSelection(rows, "publish", async payload => {
    calls.push(payload);
    return payload.rows.map(row => row.id === "7" ? {...row, ok: false, error: "Unit required"} : {...row, ok: true}).reverse();
  }, done => progress.push(done));
  assert.deepEqual(calls.map(p => p.rows.length), [25,25,2]);
  assert.deepEqual(calls[0].rows[0], {id:"0",version:4});
  assert.equal(calls[0].action,"publish");
  assert.ok(calls[0].factsConfirmed && calls[0].rightsConfirmed && calls[0].privacyConfirmed);
  assert.deepEqual(progress,[25,50,52]);
  assert.equal(results.filter(r => r.ok).length, 51);
  assert.equal(results[7].error,"Unit required");
});
test("an interrupted batch has no false success and later batches remain unsubmitted", async () => {
  const rows = Array.from({length:30}, (_,i) => ({id:String(i),version:1}));
  let calls = 0;
  const results = await publishSelection(rows,"archive",async payload => {
    calls++;
    assert.equal(payload.action,"archive");
    assert.equal(payload.factsConfirmed,undefined);
    throw Error("Connection interrupted");
  });
  assert.equal(calls,1);
  assert.equal(results[0].ok,false);
  assert.match(results[25].error,/Not submitted/);
  await assert.rejects(() => publishSelection([], "publish", () => {}), /Select/);
  await assert.rejects(() => publishSelection(rows, "delete", () => assert.fail()),/Invalid/);
});
test("teasers bound long content and exclude unsafe image paths and unsupplied facts", () => {
  const d = teaserData({
    kind: "opportunity",
    title: "a".repeat(200),
    summary: "b".repeat(600),
    public_data: { city: "Noida", image: "/images/../../private", keys: 0 },
  });
  assert.equal(d.title.length, 145);
  assert.equal(d.summary.length, 500);
  assert.equal(d.image, null);
  assert.equal(d.facts.length, 1);
  assert.equal(
    teaserData({
      kind: "product",
      title: "Cup",
      public_data: { sku: "IG-001", image: "/images/generated/example.jpg" },
    }).illustrative,
    true,
  );
});
test("listing image briefs preserve source geometry and label generated concepts", () => {
  const listing = {
    title: "Hotel brief",
    summary: "A hospitality property with an owner-supplied facade photograph.",
  };
  assert.match(
    listingImageBrief(listing, { mode: "enhance" }),
    /Preserve every structure/,
  );
  assert.match(listingImageBrief(listing), /not an actual property photograph/);
  assert.ok(
    listingImageBrief(listing, { direction: "x".repeat(2000) }).length <= 900,
  );
  assert.throws(() => listingImageBrief({ title: "A" }), /description/);
});
test("intake rejects overlong advertising claims while retaining legacy drafts", () => {
  const d = {
    title: "Property",
    body: "Documented details",
    summary: "",
    seo_title: "",
    seo_description: "",
    fields: {},
    evidence: [],
    review_questions: [],
    creative_brief: "",
  };
  assert.equal(checkIntakeResult(d, { kind: "opportunity", files: [] }), d);
  assert.throws(
    () =>
      checkIntakeResult(
        { ...d, ad_headlines: ["x".repeat(31)] },
        { kind: "opportunity", files: [] },
      ),
    /advertising/,
  );
});

import { generateIntake } from '../lib/intake.mjs';
test('intake associates coordinates with the actual map link, not an earlier website URL', async () => {
 const draft={title:'Property brief',body:'A source-based property overview.',summary:'',seo_title:'',seo_description:'',fields:{},evidence:[],review_questions:[],creative_brief:''};
 const context={kind:'opportunity',files:[],brief:'Prepare a property brief',text:'Website https://example.com Property map https://www.google.com/maps/@28.6139,77.2090,15z'};
 const result=await generateIntake({settings:{model:'test',max_output_tokens:1500},secrets:{api_key:'test'}},context,async()=>({ok:true,json:async()=>({status:'completed',id:'test',output:[{content:[{type:'output_text',text:JSON.stringify(draft)}]}]})}));
 assert.equal(result.draft.fields.latitude,'28.6139');
 assert.equal(result.draft.fields.location_source,'https://www.google.com/maps/@28.6139,77.2090,15z');
 assert.equal(result.draft.evidence.find(e=>e.field==='latitude').source,'TEXT');
});
