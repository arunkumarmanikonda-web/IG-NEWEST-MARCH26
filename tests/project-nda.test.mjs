import test from "node:test";
import assert from "node:assert/strict";
import { isCirpProject, projectNdaDraft } from "../lib/project-nda.mjs";

test("project drafts identify the project and are numbered in sequence", () => {
  for (const cirp of [true, false]) {
    const draft = projectNdaDraft({ title: "Example Property", cirp });
    assert.ok(draft.body.includes("Example Property"));
    const headings = [...draft.body.matchAll(/^(\d+)\. /gm)].map(m => Number(m[1]));
    assert.deepEqual(headings, Array.from({ length: cirp ? 12 : 11 }, (_, i) => i + 1));
    assert.equal(draft.body.includes("section 29(2)"), cirp);
    assert.ok(draft.title.length <= 180 && draft.body.length <= 30000);
    assert.ok(draft.body.includes("three years"));
  }
});

test("a CIRP tag enables the insolvency undertaking independently of tag order", () => {
  assert.equal(isCirpProject([{ label: "Development opportunity" }, { slug: "cirp" }]), true);
  assert.equal(isCirpProject([{ label: "Corporate Insolvency Resolution Process" }]), true);
  assert.equal(isCirpProject([{ label: "Strategic investment" }]), false);
});
