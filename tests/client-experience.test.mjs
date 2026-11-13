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
test("bulk publication carries the reviewed revision and reports partial permission failures", async () => {
  const calls = [],
    progress = [];
  const r = await publishSelection(
    [
      { id: "a", version: 4, title: "A" },
      { id: "b", version: 3, title: "B" },
    ],
    "publish",
    async (p) => {
      calls.push(p);
      if (p.id === "b") throw new Error("Practice permission denied");
    },
    (n) => progress.push(n),
  );
  assert.deepEqual(calls[0], {
    id: "a",
    version: 4,
    action: "publish",
    factsConfirmed: true,
    rightsConfirmed: true,
    privacyConfirmed: true,
  });
  assert.deepEqual(
    r.map((x) => x.ok),
    [true, false],
  );
  assert.match(r[1].error, /permission/);
  assert.deepEqual(progress, [1, 2]);
});
test("unpublishing never substitutes deletion, while invalid actions fail", async () => {
  let payload;
  await publishSelection([{ id: "a", version: 2 }], "archive", async (p) => {
    payload = p;
  });
  assert.deepEqual(payload, { id: "a", version: 2, action: "archive" });
  await assert.rejects(
    () => publishSelection([], "publish", () => {}),
    /Select/,
  );
  const r = await publishSelection([{ id: "a", version: 1 }], "delete", () =>
    assert.fail(),
  );
  assert.equal(r[0].ok, false);
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
