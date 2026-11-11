import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ROOM_FILE_TYPES,
  roomFileType,
  validFileSignature,
  MAX_ROOM_BYTES,
} from "../lib/data-room-formats.mjs";
import { roomPreview } from "../lib/render-room-preview.mjs";
import { practices, opportunities, insights } from "../lib/content.mjs";
import { leadership } from "../lib/company.mjs";
test("Every advertised document and image format has an explicit allowlist entry", () => {
  for (const x of [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    "csv",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "tif",
    "tiff",
    "bmp",
    "zip",
    "rtf",
    "txt",
    "odt",
    "ods",
    "odp",
  ])
    assert.ok(ROOM_FILE_TYPES[x]);
  for (const x of ["html", "exe", "js", "svg", "docm", "xlsm", "pptm"])
    assert.equal(roomFileType("file." + x), null);
});
test("Upload filenames cannot carry paths, controls or disguised executables", () => {
  for (const x of [
    "../test.pdf",
    "folder/test.pdf",
    "folder\\test.pdf",
    "test.pdf.exe",
    "test\u0000.pdf",
    "a".repeat(181) + ".pdf",
  ])
    assert.equal(roomFileType(x), null);
  assert.equal(roomFileType("REPORT.PDF").mime, "application/pdf");
});
test("Declared file format must match content signature and size", () => {
  const jpeg = fs.readFileSync("public/images/prism.jpg");
  assert.ok(validFileSignature("a.jpeg", jpeg));
  assert.equal(validFileSignature("a.pdf", jpeg), false);
  assert.equal(validFileSignature("a.png", jpeg), false);
  assert.equal(validFileSignature("a.csv", new Uint8Array([0, 1, 2])), false);
  assert.equal(
    validFileSignature("a.txt", new Uint8Array(MAX_ROOM_BYTES + 1)),
    false,
  );
});
test("Public content only references decodable image files", () => {
  for (const x of [
    ...practices,
    ...opportunities,
    ...insights,
    ...leadership.map((p) => ({ image: p.public_data.image })),
  ]) {
    if (!x.image) continue;
    const b = fs.readFileSync("public" + x.image);
    assert.ok(b.length > 1000, x.image);
    assert.ok(
      (b[0] === 255 && b[1] === 216) ||
        (b[0] === 137 && b[1] === 80) ||
        b.subarray(0, 4).toString() === "RIFF",
      x.image,
    );
  }
});
function tinyPdf() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 400] /Resources << >> /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 300] /Resources << >> /Contents 6 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let text = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((x, i) => {
    offsets.push(Buffer.byteLength(text));
    text += i + 1 + " 0 obj\n" + x + "\nendobj\n";
  });
  const pos = Buffer.byteLength(text);
  text +=
    "xref\n0 7\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((x) => String(x).padStart(10, "0") + " 00000 n \n")
      .join("") +
    "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n" +
    pos +
    "\n%%EOF";
  return Buffer.from(text);
}
test("PDF previews paginate, watermark, reject invalid pages and do not return the original", async () => {
  const data = tinyPdf();
  assert.deepEqual(
    await roomPreview(data, "application/pdf", 1, "Test", true),
    { pages: 2 },
  );
  const one = await roomPreview(data, "application/pdf", 1, "Client One");
  const two = await roomPreview(data, "application/pdf", 1, "Client Two");
  assert.equal(one.pages, 2);
  assert.equal(one.data[0], 255);
  assert.notDeepEqual(Buffer.from(one.data), Buffer.from(two.data));
  await assert.rejects(() => roomPreview(data, "application/pdf", 3, "Test"));
  await assert.rejects(() =>
    roomPreview(Buffer.from("invalid"), "application/pdf", 1, "Test"),
  );
});
