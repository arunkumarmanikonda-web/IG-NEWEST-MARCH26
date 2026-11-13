import test from "node:test";
import assert from "node:assert/strict";
import { generateIntake, checkIntakeResult, withholdUnsupportedIntakeFields } from "../lib/intake.mjs";
const context = { kind: "opportunity", practice: "real-estate", text: "City: QA Test City. Accommodation: 110 keys.", brief: "Prepare a private verification draft", files: [] };
const draft = {
  title: "Internal QA", summary: "Verification draft", body: "Technical verification only.",
  seo_title: "Internal QA", seo_description: "Verification draft", fields: { city: "QA Test City", keys: "110", category: "Hospitality" },
  evidence: [{ field: "city", value: "QA Test City", source: "TEXT", excerpt: "City: QA Test City" }, { field: "keys", value: "110", source: "TEXT", excerpt: "Accommodation: 110 keys" }],
  review_questions: [], creative_brief: "Internal test pattern only", keywords: [], ad_headlines: [], ad_descriptions: [],
};
test("live-style missing optional evidence preserves supported fields and flags the withheld field", async () => {
  const result = await generateIntake({ settings: { model: "fixture", max_output_tokens: 6000 }, secrets: { api_key: "fixture" } }, context,
    async () => ({ ok: true, json: async () => ({ status: "completed", id: "fixture", output: [{ content: [{ type: "output_text", text: JSON.stringify(draft) }] }] }) }));
  assert.equal(result.draft.fields.category, "");
  assert.equal(result.draft.fields.city, "QA Test City");
  assert.equal(result.draft.fields.keys, "110");
  assert.match(result.draft.review_questions.join(" "), /category.*left blank/);
  assert.equal(draft.fields.category, "Hospitality");
  assert.doesNotThrow(() => checkIntakeResult(result.draft, context));
});
test("withholding does not accept fabricated source references or blank evidence excerpts", () => {
  const invalid = structuredClone(draft);
  invalid.evidence[0].source = "UNKNOWN";
  assert.throws(() => checkIntakeResult(withholdUnsupportedIntakeFields(invalid), context), /references/);
  invalid.evidence[0].source = "TEXT";
  invalid.evidence[0].excerpt = " ";
  const result = withholdUnsupportedIntakeFields(invalid);
  assert.equal(result.fields.city, "");
  assert.equal(result.fields.keys, "110");
});
test("overlong advertising suggestions cannot block or truncate supported property facts", () => {
  const input = { ...draft, ad_headlines: ["A valid short headline", "An overlong advertising headline that must not block the draft"], ad_descriptions: ["x".repeat(91)], keywords: Array.from({ length: 10 }, (_, i) => "keyword " + i) };
  const result = withholdUnsupportedIntakeFields(input);
  assert.deepEqual(result.ad_headlines, ["A valid short headline"]);
  assert.deepEqual(result.ad_descriptions, []);
  assert.equal(result.keywords.length, 8);
  assert.equal(result.fields.keys, "110");
  assert.equal(result.body, draft.body);
  assert.match(result.review_questions.join(" "), /suggestions exceeding.*omitted/);
  assert.doesNotThrow(() => checkIntakeResult(result, context));
  assert.equal(input.ad_headlines.length, 2);
});
