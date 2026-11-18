import test from "node:test";
import assert from "node:assert/strict";
import { generatePerspective } from "../lib/perspectives-engine.mjs";

const base = {
  config: { mode: "enabled", secrets: { api_key: "test" }, settings: { model: "test-model" } },
  now: new Date("2026-11-17T03:00:00Z"), practices: [{ title: "Hospitality" }, { title: "Retail" }],
};
const urls = ["https://tourism.gov.in/new-release", "https://www.mospi.gov.in/survey"];
const mockDraft = {
  title: "What the new survey means for operators", summary: "A fresh issue for operators sizing their catchment.",
  selectedCandidate: 1, selectionReason: "Two independent series illuminate a live planning decision.",
  candidates: [{ topic: "New demand survey", practice: "Hospitality", reason: "Comparable local data." },
    { topic: "A retail release", practice: "Retail", reason: "Useful but narrower coverage." }],
  sources: [
    { researchId: 1, title: "Tourism release", date: "2026-11-15", evidence: "The survey recorded 3 districts." },
    { researchId: 2, title: "Survey notes", date: "2026-08-01", evidence: "District samples differ." },
  ],
  sections: [
    { heading: "Survey coverage", text: "The release covers 3 districts.", sourceIndexes: [1] },
    { heading: "Local comparisons", text: "Differences in sampling matter.", sourceIndexes: [2] },
    { heading: "Questions for operators", text: "Compare the two catchments before budgeting.", sourceIndexes: [1, 2] },
  ],
};
function result(text, addresses, citations = addresses || [], id = "resp_test") {
  const calls = addresses ? [{ type: "web_search_call", status: "completed", action: { type: "search", sources: addresses.map(url => ({ url })) } }] : [];
  return Response.json({ status: "completed", id, output: [...calls, { type: "message", content: [{ type: "output_text", text, annotations: citations.map(url => ({ type: "url_citation", url })) }] }] });
}
function run({ draft = mockDraft, addresses = urls, auditAddresses = urls, auditCitations = auditAddresses, verdict = "VERIFIED", settings = {}, failures = [], repair, verificationRepair } = {}) {
  const steps = [
    result("3 districts, released November 15; sample note from August 1.", addresses),
    result(JSON.stringify(draft)),
    ...(repair ? [result(JSON.stringify(repair))] : []),
    result(verdict + "\nTwo independent originals were consulted.", auditAddresses, auditCitations, "resp_audit"),
    result((verificationRepair?.verdict || verdict) + "\nSource-by-source review.",
      verificationRepair?.addresses || auditAddresses, verificationRepair?.citations || auditCitations, "resp_audit_retry"),
  ];
  const requests = [];
  const promise = generatePerspective({ ...base, ...settings, fetcher: async (_url, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    assert.equal(body.store, false);
    if (failures.length) return new Response("", { status: failures.shift(), headers: { "Retry-After": "0" } });
    return steps.shift();
  } });
  return { promise, requests };
}
function changed(update) { const draft = structuredClone(mockDraft); update(draft); return draft; }

test("publishes the strongest grounded topic only after a separate live verification", async () => {
  const { promise, requests } = run();
  const article = await promise;
  assert.equal(article.practice, "Hospitality");
  assert.equal(article.verification.evidence.length, 2);
  assert.match(article.verification.report, /^VERIFIED/);
  assert.equal(article.candidates.length, 2);
  assert.deepEqual(article.sources.map(s => s.url), urls);
  assert.match(article.body, /## Questions for operators/);
  assert.equal(requests.length, 3);
  assert.equal(requests[0].tools[0].type, "web_search");
  assert.equal(requests[2].tools[0].external_web_access, true);
  assert.deepEqual(Object.keys(article.sources[0]).sort(), ["date", "title", "url"]);
  assert.equal(JSON.parse(requests[0].input).since, "2026-11-11");
});
test("tracks the configured research window, staff topic preference and previously published subjects", async () => {
  const draft = changed(d => { d.sources[0].date = "2026-11-05"; });
  await assert.rejects(run({ draft }).promise, /this research window/);
  const { promise, requests } = run({ draft, settings: { cadenceDays: 14, preferredTopic: "Tourism", recentTitles: ["Prior analysis"] } });
  await promise;
  assert.equal(JSON.parse(requests[0].input).preferredTopic, "Tourism");
  assert.equal(JSON.parse(requests[2].input).since, "2026-11-04");
  await assert.rejects(run({ settings: { recentTitles: [draft.title.toUpperCase()] } }).promise, /Duplicate title/);
});
test("refuses invented references, unverified figures and invalid calendar dates", async () => {
  const cases = [
    [d => { d.sources[0].researchId = 99; }, /traced/],
    [d => { d.sources[0].date = "2026-02-31"; }, /date/],
    [d => { d.sections[0].text = "A 43% rise."; }, /cited evidence/],
    [d => { d.summary = "A 34% rise."; }, /research report/],
    [d => { d.sections[1].sourceIndexes = [4]; }, /supporting references/],
    [d => { d.sources[0].date = "2036-02-11"; }, /date/],
  ];
  for (const [alter, expected] of cases) await assert.rejects(run({ draft: changed(alter) }).promise, expected);
});
test("review holds the article on missing verification, unsupported URLs or a factual objection", async () => {
  await assert.rejects(run({ addresses: [] }).promise, /fewer than two/);
  await assert.rejects(run({ addresses: ["javascript:alert(1)", urls[1]] }).promise, /fewer than two/);
  await assert.rejects(run({ verdict: "HOLD" }).promise, /held the article/);
  await assert.rejects(run({ auditAddresses: urls.slice(0, 1) }).promise, /corroborate/);
  await assert.rejects(run({ auditCitations: [urls[0]] }).promise, /corroborate/);
  await assert.rejects(run({ addresses: [urls[0], urls[0] + "?utm_source=news"] }).promise, /fewer than two/);
});

test("rechecks every source once when a positive audit omits source citations", async () => {
  const { promise, requests } = run({ auditCitations: [urls[0]], verificationRepair: { citations: urls } });
  const article = await promise;
  assert.equal(requests.length, 4);
  assert.deepEqual(JSON.parse(requests[3].input).missingSourceURLs, [urls[1]]);
  assert.deepEqual(JSON.parse(requests[3].input).sections, article.sections);
  assert.deepEqual(JSON.parse(requests[3].input).sources, article.sources);
  assert.equal(requests[3].tool_choice, "required");
  assert.deepEqual(article.verification.providerResponseIds.slice(-2), ["resp_audit", "resp_audit_retry"]);
});
test("missing citations remain a hold after one retry and factual objections cannot be overruled", async () => {
  const missing = run({ auditCitations: [urls[0]] });
  await assert.rejects(missing.promise, /could not corroborate.*mospi/);
  assert.equal(missing.requests.length, 4);
  const negative = run({ verdict: "HOLD", verificationRepair: { verdict: "VERIFIED", citations: urls } });
  await assert.rejects(negative.promise, /held the article/);
  assert.equal(negative.requests.length, 3);
  const newObjection = run({ auditCitations: [urls[0]], verificationRepair: { verdict: "HOLD", citations: urls } });
  await assert.rejects(newObjection.promise, /held the article/);
  assert.equal(newObjection.requests.length, 4);
});

test("only public practice titles can be sent as ranked audience interests", async () => {
  const { promise, requests } = run({ settings: {
    audienceInterests: ["Retail", "visitor@private.example", "Retail", { lastQuestion: "confidential note" }, "Hospitality"],
  } });
  await promise;
  assert.deepEqual(JSON.parse(requests[0].input).audienceInterests, ["Retail", "Hospitality"]);
  assert.doesNotMatch(JSON.stringify(requests), /visitor@private|confidential note/);
});

test("held runs retain the independent review and public research, never provider credentials", async () => {
  const held = run({verdict:'HOLD'});
  await assert.rejects(held.promise, error => {
    assert.equal(error.perspectiveDiagnostics.stage, 'independent verification');
    assert.match(error.perspectiveDiagnostics.verificationReport, /^HOLD/);
    assert.ok(error.perspectiveDiagnostics.researchReport);
    assert.equal(error.perspectiveDiagnostics.draft.title, mockDraft.title);
    assert.equal(error.perspectiveDiagnostics.providerResponseIds.length, 3);
    assert.doesNotMatch(JSON.stringify(error.perspectiveDiagnostics), /api_key|secrets|Authorization/);
    return true;
  });
});
test("reasoning research reserves output capacity without changing ordinary model requests", async () => {
  const reasoned = run({settings:{config:{...base.config, settings:{model:'gpt-6.2-astra',max_output_tokens:18000}}}});
  await reasoned.promise;
  assert.equal(reasoned.requests[0].reasoning.effort,'low');
  assert.equal(reasoned.requests[0].max_output_tokens,16400);
  assert.equal(reasoned.requests[2].max_output_tokens,14600);
  const plain = run();await plain.promise;assert.equal(plain.requests[0].reasoning,undefined);
});

test("only one transient provider failure is retried, and client errors fail immediately", async () => {
  const once = run({ failures: [503] });
  await once.promise;
  assert.equal(once.requests.length, 4);
  const twice = run({ failures: [503, 502] });
  await assert.rejects(twice.promise, /HTTP 502/);
  assert.equal(twice.requests.length, 2);
  const invalid = run({ failures: [400] });
  await assert.rejects(invalid.promise, /HTTP 400/);
  assert.equal(invalid.requests.length, 1);
});

test("repairs publication metadata without truncating a sentence or changing supporting evidence", async () => {
  const first = "Current survey definitions deserve attention.";
  const long = changed(d => { d.summary = first + " Consider " + "word ".repeat(105) + "."; });
  const normalized = run({ draft: long });
  assert.equal((await normalized.promise).summary, first);
  assert.equal(normalized.requests.length, 3);
  const bad = changed(d => { d.title = "title ".repeat(40); d.summary = "sentence ".repeat(100); });
  const corrected = run({ draft: bad, repair: { title: "Fresh survey guidance", summary: first } });
  const article = await corrected.promise;
  assert.equal(article.title, "Fresh survey guidance");
  assert.equal(corrected.requests.length, 4);
  assert.equal(corrected.requests[2].text.format.name, "perspective_metadata");
  assert.equal(JSON.parse(corrected.requests[3].input).title, article.title);
  const stillBad = run({ draft: bad, repair: { title: "", summary: "x".repeat(700) } });
  await assert.rejects(stillBad.promise, /title 0\/160 characters, summary 700\/500/);
});
test("missing sources are a distinct evidence hold and cannot be repaired by rewriting a headline", async () => {
  const insufficient = run({ draft: changed(d => { d.sources = []; d.title = ""; d.summary = ""; }) });
  await assert.rejects(insufficient.promise, /Evidence hold/);
  assert.equal(insufficient.requests.length, 2);
});

test("removes a whole unsupported sentence while leaving the original evidence and independent check intact", async () => {
  const supported = "The survey covers 3 districts. Operators can compare their own catchment with the survey coverage before adjusting a budget.";
  const draft = changed(d => { d.sections[0].text = "There are 43 eligible cities. " + supported; });
  const { promise, requests } = run({ draft });
  const article = await promise;
  assert.equal(article.sections[0].text, supported);
  assert.equal(article.verification.evidence[0].note, mockDraft.sources[0].evidence);
  assert.equal(JSON.parse(requests[2].input).sections[0].text, supported);
  assert.doesNotMatch(article.body, /43/);
  await assert.rejects(run({ draft, verdict: "HOLD" }).promise, /held the article/);
});
test("holds if removal leaves no substantive text, a dangling inference, or a heading based on the figure", async () => {
  for (const [value, message] of [
    ["The survey covers 43 districts. Check it.", /Too little independent prose/],
    ["The survey covers 43 districts. This comparison would make a sizeable difference to budget decisions for the operations team.", /depends on the omitted claim/],
  ]) {
    await assert.rejects(run({ draft: changed(d => { d.sections[0].text = value; }) }).promise, message);
  }
  await assert.rejects(run({ draft: changed(d => { d.sections[0].heading = "Coverage of 43 districts"; }) }).promise, /heading requires a rewrite/);
});
