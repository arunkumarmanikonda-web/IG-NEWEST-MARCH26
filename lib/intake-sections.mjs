import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";
import { sourceTypes } from "./intake-source-spec.mjs";
const PAGES_PER_SECTION = 20,
  TEXT_PER_SECTION = 80000,
  PROVIDER_BYTES = 40_000_000;
export function intakeBriefHash(p) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        p.kind,
        p.operation_kind || "",
        p.practice,
        p.brief || "",
        p.text || "",
      ]),
    )
    .digest("hex");
}
function officeText(file) {
  let expanded = 0,
    unsupported = false;
  const entries = unzipSync(new Uint8Array(file.bytes), {
    filter: (f) => {
      const wanted =
        /^(word\/(document|footnotes|endnotes|header\d*|footer\d*)\.xml|ppt\/slides\/slide\d+\.xml|xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml))$/.test(
          f.name,
        );
      if (wanted) {
        expanded += f.originalSize;
        if (expanded > 150_000_000) unsupported = true;
      }
      return wanted && !unsupported;
    },
  });
  if (unsupported)
    throw new Error(
      "The source is uploaded privately, but its expanded document data needs a specialist processing pass. No content has been discarded.",
    );
  const text = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(
      ([name, bytes]) =>
        "Source component: " +
        name +
        "\n" +
        Buffer.from(bytes).toString("utf8"),
    )
    .join("\n\n");
  if (!text.trim())
    throw new Error(
      "The source is uploaded, but no readable document text was found.",
    );
  return text;
}
export async function describeSourceSections(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") {
    const pdf = await PDFDocument.load(file.bytes, { updateMetadata: false });
    return {
      count: Math.ceil(pdf.getPageCount() / PAGES_PER_SECTION),
      pages: pdf.getPageCount(),
      type: "pdf",
    };
  }
  if (["txt", "csv"].includes(ext))
    return {
      count: Math.max(
        1,
        Math.ceil(file.bytes.toString("utf8").length / TEXT_PER_SECTION),
      ),
      type: "text",
    };
  if (
    file.bytes.length > PROVIDER_BYTES &&
    ["docx", "pptx", "xlsx"].includes(ext)
  )
    return {
      count: Math.ceil(officeText(file).length / TEXT_PER_SECTION),
      type: "office-text",
    };
  return { count: 1, type: "original" };
}
async function rasterPDF(file, first, last) {
  const { createCanvas, DOMMatrix, ImageData, Path2D } =
    await import("@napi-rs/canvas");
  globalThis.DOMMatrix ??= DOMMatrix;
  globalThis.ImageData ??= ImageData;
  globalThis.Path2D ??= Path2D;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { pathToFileURL } = await import("node:url");
  const path = await import("node:path");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ),
  ).href;
  const task = pdfjs.getDocument({
    data: new Uint8Array(file.bytes),
    isEvalSupported: false,
    disableFontFace: true,
    maxImageSize: 40000000,
  });
  try {
    const source = await task.promise,
      out = await PDFDocument.create();
    for (let n = first; n <= last; n++) {
      const page = await source.getPage(n),
        size = page.getViewport({ scale: 1 }),
        view = page.getViewport({
          scale: Math.min(2, 2000 / Math.max(size.width, size.height)),
        });
      const canvas = createCanvas(
          Math.ceil(view.width),
          Math.ceil(view.height),
        ),
        ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: view }).promise;
      const jpg = await out.embedJpg(await canvas.encode("jpeg", 88));
      const target = out.addPage([size.width, size.height]);
      target.drawImage(jpg, {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
      });
    }
    return Buffer.from(await out.save());
  } finally {
    await task.destroy();
  }
}
export async function readSourceSection(file, section) {
  const plan = await describeSourceSections(file);
  if (!Number.isInteger(section) || section < 0 || section >= plan.count)
    throw new Error("Choose an available document section.");
  let bytes = file.bytes,
    name = file.name,
    notes = [];
  if (plan.type === "pdf") {
    const original = await PDFDocument.load(file.bytes, {
        updateMetadata: false,
      }),
      part = await PDFDocument.create();
    const first = section * PAGES_PER_SECTION,
      last = Math.min(plan.pages, first + PAGES_PER_SECTION);
    const copied = await part.copyPages(
      original,
      Array.from({ length: last - first }, (_, i) => first + i),
    );
    copied.forEach((page) => part.addPage(page));
    bytes = Buffer.from(await part.save());
    name =
      file.name.replace(/\.pdf$/i, "") +
      " · pages " +
      (first + 1) +
      "–" +
      last +
      ".pdf";
    if (bytes.length > PROVIDER_BYTES) {
      bytes = await rasterPDF(file, first + 1, last);
      notes.push(
        "Dense PDF pages were rendered for AI reading. Verify small print and measurements against the original.",
      );
    }
  } else if (plan.type === "text" || plan.type === "office-text") {
    const text =
      plan.type === "text" ? file.bytes.toString("utf8") : officeText(file);
    bytes = Buffer.from(
      text.slice(section * TEXT_PER_SECTION, (section + 1) * TEXT_PER_SECTION),
    );
    name = file.name + " · section " + (section + 1) + ".txt";
    if (plan.type === "office-text")
      notes.push(
        "Document text is processed in sections. Embedded imagery should be reviewed separately.",
      );
  } else if (bytes.length > PROVIDER_BYTES) {
    if (
      sourceTypes[file.name.split(".").pop().toLowerCase()]?.startsWith(
        "image/",
      )
    ) {
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const image = await loadImage(bytes);
      if (image.width * image.height > 100000000)
        throw new Error(
          "Original uploaded. This image needs a lower-resolution processing copy; the upload is retained.",
        );
      const scale = Math.min(1, 2400 / Math.max(image.width, image.height)),
        canvas = createCanvas(
          Math.round(image.width * scale),
          Math.round(image.height * scale),
        );
      canvas
        .getContext("2d")
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      bytes = Buffer.from(await canvas.encode("jpeg", 90));
      name = file.name + ".jpg";
      notes.push(
        "AI used a resized copy; the original remains private and unchanged.",
      );
    }
  }
  return {
    file: { name, bytes, source_id: file.source_id },
    count: plan.count,
    notes,
  };
}
// A final draft can only combine every completed section of these exact sources
// and this exact brief. It cannot silently omit failed sections or mix projects.
export function reviewCompletedSections(rows, sources, briefHash, actorId) {
  const groups = [];
  for (const source of sources) {
    const parts = rows
      .filter((row) => row.context?.source_id === source.id)
      .sort((a, b) => a.context.section - b.context.section);
    const count = parts[0]?.context.section_count;
    if (!Number.isInteger(count) || count < 1 || parts.length !== count)
      throw new Error(
        "Some source sections are still unfinished. Resume processing before combining the draft.",
      );
    parts.forEach((row, index) => {
      const c = row.context;
      if (
        row.actor_id !== actorId ||
        row.status !== "ready" ||
        row.practice !== source.practice ||
        c.kind !== "intake_section" ||
        c.brief_hash !== briefHash ||
        c.source_sha256 !== source.sha256 ||
        c.section !== index ||
        c.section_count !== count
      )
        throw new Error(
          "Source sections do not match this brief or your permissions.",
        );
    });
    groups.push({ source, parts });
  }
  if (groups.reduce((n, g) => n + g.parts.length, 0) !== rows.length)
    throw new Error("Unexpected or duplicate source section.");
  return groups;
}
export function sectionSummaryFiles(groups) {
  return groups.map(({ source, parts }) => ({
    source_id: source.id,
    name: source.name + " · reviewed extraction.txt",
    bytes: Buffer.from(
      parts
        .map((p) =>
          JSON.stringify({
            source: source.name,
            section: p.context.section + 1,
            total_sections: p.context.section_count,
            draft: p.draft,
          }),
        )
        .join("\n"),
    ),
  }));
}

export function reconcileMergedFacts(draft, groups) {
  const result = structuredClone(draft);
  for (const [field, value] of Object.entries(result.fields || {})) {
    const supplied = [];
    groups.forEach(({ parts }, sourceIndex) =>
      parts.forEach((part) => {
        for (const evidence of part.draft.evidence || [])
          if (
            evidence.field === field &&
            evidence.value &&
            evidence.value === part.draft.fields?.[field]
          )
            supplied.push({
              ...evidence,
              source: "S" + (sourceIndex + 1),
              excerpt: (
                "Section " +
                (part.context.section + 1) +
                ": " +
                evidence.excerpt
              ).slice(0, 300),
            });
      }),
    );
    const values = [...new Set(supplied.map((e) => e.value.trim()))];
    if (values.length > 1 || (value && !values.includes(value.trim()))) {
      result.fields[field] = "";
      result.evidence = result.evidence.filter((e) => e.field !== field);
      result.review_questions.push(
        (
          "Verify source values for " +
          field.replaceAll("_", " ") +
          ": " +
          values.join(" / ")
        ).slice(0, 500),
      );
    } else if (value && supplied.some((e) => e.value === value)) {
      result.evidence = result.evidence.filter((e) => e.field !== field);
      result.evidence.push(supplied.find((e) => e.value === value));
    }
  }
  return result;
}
