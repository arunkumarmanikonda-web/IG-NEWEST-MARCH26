import test from "node:test";
import assert from "node:assert/strict";
import { listingLifecycle, listingStatusText } from "../lib/listing-lifecycle.mjs";
import { collectionItems } from "../lib/property-collection.mjs";
import { buildSearchIndex, filterSearch } from "../lib/site-search.mjs";

const deadline = "2030-06-30T18:30:00.000Z";
const archived = { listing_status: "sold", listing_status_label: "A successful close", listing_archived: true, listing_archive_until: deadline };

test("Archived visibility expires exactly at the configured instant and fails closed for missing or invalid dates", () => {
  assert.equal(listingLifecycle(archived, Date.parse(deadline) - 1).visible, true);
  assert.equal(listingLifecycle(archived, Date.parse(deadline)).visible, false);
  assert.equal(listingLifecycle({...archived,listing_archive_until:null}).visible, false);
  assert.equal(listingLifecycle({...archived,listing_archive_until:"not a date"}).visible, false);
  assert.equal(listingLifecycle({listing_status:"sold",listing_archived:false,listing_archive_until:"2000-01-01"}).visible, true);
});

test("Creative wording cannot reopen or disguise sold, pending or archived listings", () => {
  for (const status of ["reserved", "under_offer", "sold", "withdrawn"]) {
    const record = {public_data:{listing_status:status,listing_status_label:"An exciting opportunity"}};
    const state = listingLifecycle(record);
    assert.equal(state.isAvailable, false);
    assert.match(listingStatusText(record), new RegExp(state.canonicalLabel));
  }
  assert.equal(listingLifecycle({...archived,listing_status:"available"},Date.parse(deadline)-1).isAvailable,false);
  assert.equal(listingStatusText({listing_status:"available",listing_archived:true}),"Archived");
  assert.equal(listingLifecycle({listing_status:"unknown"}).isAvailable,false);
});

test("Legacy restrictions and portfolio references remain unavailable until deliberately reclassified", () => {
  for (const availability of ["Sold", "Reserved", "Under offer", "Not available", "Off market", "Closed"]) {
    assert.equal(listingLifecycle({availability}).isAvailable,false,availability);
  }
  assert.equal(listingLifecycle({reference:"Portfolio reference",availability:"Available"}).isAvailable,false);
  assert.equal(listingStatusText({reference:"Portfolio reference"}),"Portfolio reference");
  assert.equal(listingLifecycle({listing_status:"available",availability:"Sold"}).isAvailable,true);
});

test("Property filters retain visible closed records, exclude expired archives, and put active stock first", () => {
  const base = {location:"Gurugram",sector:"Commercial",type:"Office"};
  const expired = {...base,title:"Expired",listing_status:"sold",listing_archived:true,listing_archive_until:"2000-01-01T00:00:00Z"};
  const sold = {...base,title:"Sold property",listing_status:"sold",listing_status_label:"Successfully placed",listing_archived:true,listing_archive_until:"2999-01-01T00:00:00Z"};
  const available = {...base,title:"Available property",listing_status:"available"};
  const reserved = {...base,title:"Reserved property",listing_status:"reserved"};
  const input = [expired,sold,reserved,available];
  assert.deepEqual(collectionItems(input).map(x=>x.title),[available.title,reserved.title,sold.title]);
  assert.deepEqual(collectionItems(input,{status:"sold"}),[sold]);
  assert.deepEqual(collectionItems(input,{status:"archived"}),[sold]);
  assert.deepEqual(collectionItems(input,{status:"available"}),[available]);
  assert.deepEqual(collectionItems(input,{query:"successfully placed"}),[sold]);
  assert.equal(input[0],expired);
});

test("Global search labels retained sold records and never indexes expired archives or draft rows", () => {
  const source = {kind:"opportunity",slug:"sold-property",title:"Sold tower",summary:"Office investment",public_data:{...archived,listing_archive_until:"2999-01-01T00:00:00Z"}};
  const expired = {...source,slug:"expired",public_data:{...archived,listing_archive_until:"2000-01-01T00:00:00Z"}};
  const draft = {...source,slug:"draft",status:"draft"};
  const rows = buildSearchIndex([source,expired,draft],[]).filter(row=>row.kind==="opportunity");
  assert.equal(rows.length,1);
  assert.match(rows[0].summary,/A successful close · Sold · Archived/);
  assert.match(rows[0].summary,/retained for reference/);
  assert.equal(filterSearch(rows,{q:"successful close"}).length,1);
  assert.equal(filterSearch([{...rows[0],listing_archive_until:"2000-01-01T00:00:00Z"}]).length,0);
});
