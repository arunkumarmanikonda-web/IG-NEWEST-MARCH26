import test from "node:test";
import assert from "node:assert/strict";
import { archiveDateAfter, archiveDateDeadline, indiaDate } from "../lib/listing-schedule.mjs";

test("archive dates use India midnight and include the entire chosen date",()=>{
  assert.equal(indiaDate("2026-11-24T19:00:00Z"),"2026-11-25");
  assert.equal(archiveDateDeadline("2026-11-25"),"2026-11-25T18:29:59.999Z");
  assert.equal(archiveDateAfter(30,"2026-11-24T19:00:00Z"),"2026-12-25");
  assert.equal(archiveDateAfter(90,"2026-11-24T19:00:00Z"),"2027-02-23");
});
test("invalid and rollover calendar dates cannot schedule public visibility",()=>{
  for(const value of ["","2026-02-30","2026-13-01","25/11/2026","2026-11-25T12:00:00Z"]) assert.throws(()=>archiveDateDeadline(value));
  assert.equal(archiveDateDeadline("2028-02-29"),"2028-02-29T18:29:59.999Z");
});
