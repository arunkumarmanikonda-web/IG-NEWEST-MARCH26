import test from "node:test";
import assert from "node:assert/strict";
import { listingRevision } from "../lib/listing-revision.mjs";

test("Publications, revisions, republications and withdrawals change the public listing revision", () => {
  const first = { id: "a", version: 1, published_at: "2026-11-16T00:00:00Z" };
  const second = { ...first, id: "b" };
  assert.equal(listingRevision([first, second]), listingRevision([second, first]));
  for (const rows of [[], [second], [first, second], [{...first, version: 2}], [{...first, published_at: "2026-11-17T00:00:00Z"}]]) {
    assert.notEqual(listingRevision([first]), listingRevision(rows));
  }
});

test("Reordering terms leaves the revision stable while public taxonomy edits refresh listings", () => {
  const record = { id: "property", version: 1 };
  const term = { id: "c", slug: "cirp", label: "CIRP", dimension: "opportunity-context" };
  const other = { ...term, id: "s", slug: "strategic", label: "Strategic investment" };
  const revision = tags => listingRevision([{ ...record, tags }]);
  assert.equal(revision([term, other]), revision([other, term]));
  assert.notEqual(revision([term, other]), revision([term]));
  assert.notEqual(revision([term]), revision([{ ...term, label: "Restructuring" }]));
});

test("availability and archive schedule refresh an open listing without an editorial revision",()=>{
  const record={id:"a",version:3,public_data:{listing_status:"available"}};
  for(const patch of [{listing_status:"sold"},{listing_status_label:"Successfully placed"},{listing_archived:true},{listing_archive_until:"2026-12-25T18:29:59.999Z"}]) {
    assert.notEqual(listingRevision([record]),listingRevision([{...record,public_data:{...record.public_data,...patch}}]));
  }
});
