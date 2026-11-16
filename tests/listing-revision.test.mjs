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
