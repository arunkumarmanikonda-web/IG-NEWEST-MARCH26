import test from "node:test";
import assert from "node:assert/strict";
import { readRegister, visibleInRegister } from "../lib/registers.mjs";

function pages(rows, failAt) {
  return () => {
    let after = "";
    return {
      order() { return this; },
      limit(size) { this.size = size; return this; },
      gt(field, value) { assert.equal(field, "id"); after = value; return this; },
      then(resolve) {
        const data = rows.filter(row => row.id > after).slice(0, this.size);
        resolve(after === failAt ? { data:null, error:{message:"Page unavailable"} } : { data, error:null });
      },
    };
  };
}
test("publishing register reads the 1001st record, with stable tie order", async () => {
  const rows = Array.from({length:1001}, (_,i) => ({id:String(i).padStart(4,"0"),updated_at:i===1000?"2026-11-15":"2026-11-14"}));
  const result = await readRegister(pages(rows), "updated_at");
  assert.equal(result.data.length, 1001);
  assert.equal(result.data[0].id, "1000");
  assert.equal(result.data[1].id, "0000");
  const failed = await readRegister(pages(rows, "0499"));
  assert.equal(failed.data, null);
  assert.ok(failed.error);
});
test("archived and deleted stock stay out of active and unpublished selections", () => {
  const archived = {status:"archived"}, removed = {...archived,deleted_at:"2026-11-15"};
  for (const filter of ["active","unlive","live","draft"]) {
    assert.equal(visibleInRegister(archived,filter),false);
    assert.equal(visibleInRegister(removed,filter),false);
  }
  assert.ok(visibleInRegister(removed,"deleted"));
  assert.ok(visibleInRegister(archived,"archived"));
  assert.ok(visibleInRegister({status:"draft"},"unlive"));
  assert.ok(visibleInRegister({status:"draft",live_version:2},"live"));
});

test("file permission paging carries both grant and file across a boundary", async () => {
  const rows = Array.from({length:251}, (_,i) => ({grant_id:"grant-a",file_id:String(i).padStart(3,"0")}));
  let cursor, calls = 0;
  const query = () => ({
    order() {return this;}, limit() {return this;},
    or(value) {cursor=value;return this;},
    then(resolve) {calls++;resolve({data:calls===1?rows.slice(0,250):rows.slice(250),error:null});},
  });
  const {data}=await readRegister(query,null,["grant_id","file_id"]);
  assert.deepEqual(data,rows);
  assert.equal(cursor,"grant_id.gt.grant-a,and(grant_id.eq.grant-a,file_id.gt.249)");
});

test("temporarily displayed archives appear in Live and Archived but never active bulk selection",()=>{
  const row={status:"draft",listing_archived:true,live_version:2,archive_until:"2026-12-25T18:29:59.999Z"};
  const now=Date.parse("2026-11-25T00:00:00Z");
  assert.equal(visibleInRegister(row,"live",now),true);
  assert.equal(visibleInRegister(row,"archived",now),true);
  assert.equal(visibleInRegister(row,"active",now),false);
  assert.equal(visibleInRegister(row,"draft",now),false);
  assert.equal(visibleInRegister(row,"live",Date.parse(row.archive_until)),false);
  assert.equal(visibleInRegister({...row,deleted_at:"2026-11-25"},"live",now),false);
});
