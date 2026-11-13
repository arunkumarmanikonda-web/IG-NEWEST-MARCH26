import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import {
  validateSourceSelection,
  validateSourceIds,
} from "../lib/intake-source-spec.mjs";
import { hashSourceFile, uploadIntakeSources } from "../lib/intake-upload.mjs";
import { loadIntakeSources } from "../lib/intake-storage.mjs";
import {
  describeSourceSections,
  readSourceSection,
  reviewCompletedSections,
  reconcileMergedFacts,
} from "../lib/intake-sections.mjs";
import { processIntakeDraft } from "../lib/intake-process.mjs";
import { validateIntake } from "../lib/intake.mjs";
const id = "11111111-1111-4111-8111-111111111111",
  actor = "22222222-2222-4222-8222-222222222222";
const input = {
  kind: "opportunity",
  practice: "real-estate",
  approved: true,
  brief: "Prepare a source-based property draft",
  text: "Owner approved source details",
  files: [],
};

test("Source selection has no imposed MB cap; unsafe formats and empty files still fail", () => {
  assert.equal(
    validateSourceSelection([{ name: "Large.pdf", size: 12_000_000_000 }]),
    12_000_000_000,
  );
  assert.equal(
    validateSourceSelection([
      { name: "A.pdf", size: 60_000_000 },
      { name: "B.docx", size: 70_000_000 },
    ]),
    130_000_000,
  );
  assert.throws(
    () => validateSourceSelection([{ name: "run.exe", size: 5 }]),
    /Use PDF/,
  );
  assert.throws(
    () => validateSourceSelection([{ name: "empty.pdf", size: 0 }]),
    /non-empty/,
  );
  assert.throws(() => validateSourceIds([id, id]), /distinct/);
  assert.throws(
    () => validateSourceIds(["https://example.com/private"]),
    /distinct/,
  );
});
test("Large file hashing uses slices and matches SHA256 without reading the whole file", async () => {
  const bytes = Buffer.alloc(13_000_000, 5),
    file = new File([bytes], "large.pdf");
  file.arrayBuffer = () => {
    throw new Error("Whole file read");
  };
  assert.equal(
    await hashSourceFile(file),
    createHash("sha256").update(bytes).digest("hex"),
  );
});
test("Completed source uploads are reused and application requests contain metadata only", async () => {
  const file = new File(["source text"], "notes.txt");
  let uploadCount = 0;
  const ids = await uploadIntakeSources({
    files: [file],
    practice: "real-estate",
    approved: true,
    projectUrl: "https://test.supabase.co",
    fetcher: async (url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.size, 11);
      assert.equal(body.data, undefined);
      assert.match(body.sha256, /^[a-f0-9]{64}$/);
      return Response.json({ source: { id, uploaded: true } });
    },
    uploadFile: async () => {
      uploadCount++;
    },
  });
  assert.deepEqual(ids, [id]);
  assert.equal(uploadCount, 0);
});
test("Private source load refuses size, hash, practice and permission mismatch", async () => {
  const bytes = Buffer.from("source document"),
    row = {
      id,
      practice: "real-estate",
      name: "source.txt",
      mime: "text/plain",
      path: "opaque/source.txt",
      size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  const client = {
    rpc: async () => ({ data: [row] }),
    storage: {
      from: (bucket) => {
        assert.equal(bucket, "ig-intake-sources");
        return {
          download: async (path) => {
            assert.equal(path, row.path);
            return { data: new Blob([bytes]) };
          },
        };
      },
    },
  };
  assert.equal(
    (await loadIntakeSources(client, [id], "real-estate"))[0].bytes.toString(),
    "source document",
  );
  row.sha256 = "a".repeat(64);
  await assert.rejects(
    loadIntakeSources(client, [id], "real-estate"),
    /integrity/,
  );
  row.size++;
  await assert.rejects(
    loadIntakeSources(client, [id], "real-estate"),
    /incomplete/,
  );
  await assert.rejects(loadIntakeSources(client, [id], "horeca"), /metadata/);
  client.rpc = async () => ({ error: { message: "denied" } });
  await assert.rejects(
    loadIntakeSources(client, [id], "real-estate"),
    /permissions/,
  );
});
test("Large originals are accepted and PDFs are divided without dropping pages", async () => {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 41; i++) pdf.addPage([200, 200]);
  const bytes = Buffer.concat([
      Buffer.from(await pdf.save()),
      Buffer.alloc(26_000_000, 32),
    ]),
    file = { name: "deck.pdf", bytes, source_id: id };
  assert.equal(
    validateIntake(input, [file]).files[0].bytes.length,
    bytes.length,
  );
  const plan = await describeSourceSections(file);
  assert.deepEqual(plan, { count: 3, pages: 41, type: "pdf" });
  const part = await readSourceSection(file, 2);
  assert.equal((await PDFDocument.load(part.file.bytes)).getPageCount(), 1);
  assert.match(part.file.name, /41–41/);
  await assert.rejects(readSourceSection(file, 3), /available/);
});
test("Combining sections rejects missing pieces, cross-project content and another actor", () => {
  const source = {
    id,
    practice: "real-estate",
    sha256: "hash",
    name: "deck.pdf",
  };
  const make = (n) => ({
    id: String(n),
    actor_id: actor,
    practice: "real-estate",
    status: "ready",
    draft: {},
    context: {
      kind: "intake_section",
      source_id: id,
      brief_hash: "brief",
      source_sha256: "hash",
      section: n,
      section_count: 2,
    },
  });
  assert.equal(
    reviewCompletedSections([make(1), make(0)], [source], "brief", actor)[0]
      .parts[0].context.section,
    0,
  );
  assert.throws(
    () => reviewCompletedSections([make(0)], [source], "brief", actor),
    /unfinished/,
  );
  assert.throws(
    () => reviewCompletedSections([make(0), make(1)], [source], "other", actor),
    /match/,
  );
  assert.throws(
    () =>
      reviewCompletedSections([make(0), make(1)], [source], "brief", "other"),
    /permissions/,
  );
  assert.throws(
    () => reviewCompletedSections([make(0), make(0)], [source], "brief", actor),
    /match/,
  );
});
test("Staged workflow retains all sections, respects rate limits, and merges after completion", async () => {
  const calls = [];
  let rate = true,
    waited = 0;
  const result = await processIntakeDraft({
    sourceIds: [id],
    input,
    wait: async (ms) => {
      waited += ms;
    },
    fetcher: async (url, options) => {
      const p = JSON.parse(options.body);
      calls.push(p.action);
      if (p.action === "plan") return Response.json({ count: 2 });
      if (p.action === "section" && rate) {
        rate = false;
        return Response.json(
          { error: "Wait 30 seconds before generating another draft" },
          { status: 429 },
        );
      }
      if (p.action === "section")
        return Response.json({
          id: "job-" + p.section,
          candidates: [],
          notes: [],
        });
      assert.deepEqual(p.jobs, ["job-0", "job-1"]);
      return Response.json({ id: "combined", draft: { title: "Final" } });
    },
  });
  assert.equal(result.id, "combined");
  assert.equal(waited, 31000);
  assert.equal(calls.at(-1), "merge");
});
test("Pausing does not submit another paid section", async () => {
  let calls = 0;
  await assert.rejects(
    processIntakeDraft({
      sourceIds: [id],
      input,
      shouldPause: () => true,
      fetcher: async () => {
        calls++;
        return Response.json({ count: 3 });
      },
    }),
    /paused/,
  );
  assert.equal(calls, 1);
});

test("Merged facts retain original evidence and flag unsupported or conflicting specifications", () => {
  const part = (section, value) => ({
    context: { section },
    draft: {
      fields: { area: value },
      evidence: [
        { field: "area", value, source: "S1", excerpt: "Source area " + value },
      ],
    },
  });
  const draft = {
    fields: { area: "100", city: "Invented City" },
    evidence: [],
    review_questions: [],
  };
  const valid = reconcileMergedFacts(draft, [{ parts: [part(0, "100")] }]);
  assert.equal(valid.fields.area, "100");
  assert.equal(valid.fields.city, "");
  assert.match(valid.evidence[0].excerpt, /Section 1/);
  const conflict = reconcileMergedFacts(draft, [
    { parts: [part(0, "100"), part(1, "200")] },
  ]);
  assert.equal(conflict.fields.area, "");
  assert.equal(conflict.evidence.length, 0);
  assert.match(conflict.review_questions.join(" "), /100 \/ 200/);
});
