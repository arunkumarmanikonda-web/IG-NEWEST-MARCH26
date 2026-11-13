import {
  createCanvas,
  loadImage,
  DOMMatrix,
  ImageData,
  Path2D,
} from "@napi-rs/canvas";
import path from "node:path";
import { pathToFileURL } from "node:url";
const pdfRoot = path.join(process.cwd(), "node_modules", "pdfjs-dist");
globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;
export async function roomPreview(
  bytes,
  mime,
  page = 1,
  identity = "Private access",
  infoOnly = false,
) {
  let pdf,
    task,
    canvas,
    context,
    pages = 1;
  try {
    if (mime === "application/pdf") {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(pdfRoot, "legacy/build/pdf.worker.mjs"),
      ).href;
      task = pdfjs.getDocument({
        data: new Uint8Array(bytes),
        isEvalSupported: false,
        disableFontFace: true,
        useSystemFonts: true,
        stopAtErrors: true,
        maxImageSize: 16000000,
        standardFontDataUrl: pdfRoot + "/standard_fonts/",
        cMapUrl: pdfRoot + "/cmaps/",
        cMapPacked: true,
        wasmUrl: pdfRoot + "/wasm/",
      });
      pdf = await task.promise;
      pages = pdf.numPages;
      if (pages > 500)
        throw new Error("Preview limited to 500 pages per file.");
      if (infoOnly) return { pages };
      if (!Number.isInteger(page) || page < 1 || page > pages)
        throw new Error("Page not found");
      const sheet = await pdf.getPage(page),
        base = sheet.getViewport({ scale: 1 });
      if (base.width <= 0 || base.height <= 0)
        throw new Error("Invalid page dimensions");
      const scale = Math.min(1.6, 1400 / base.width, 1800 / base.height),
        viewport = sheet.getViewport({ scale });
      canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      context = canvas.getContext("2d");
      await sheet.render({ canvas, viewport, background: "rgb(255,255,255)" })
        .promise;
    } else {
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
        throw new Error("A PDF preview is required.");
      if (infoOnly) return { pages: 1 };
      if (page !== 1) throw new Error("Page not found");
      const img = await loadImage(Buffer.from(bytes));
      if (img.width * img.height > 40000000)
        throw new Error("Image exceeds preview resolution limit");
      const scale = Math.min(1, 1400 / img.width, 1800 / img.height);
      canvas = createCanvas(
        Math.ceil(img.width * scale),
        Math.ceil(img.height * scale),
      );
      context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    const stamp = "INDIA GULLY · " + identity.slice(0, 100);
    context.save();
    context.fillStyle = "rgba(32,58,51,0.15)";
    context.font = Math.max(13, canvas.width / 55) + "px sans-serif";
    context.textAlign = "center";
    for (let y = 100; y < canvas.height; y += 260) {
      context.save();
      context.translate(canvas.width / 2, y);
      context.rotate(-Math.PI / 9);
      context.fillText(stamp, 0, 0);
      context.restore();
    }
    context.restore();
    context.fillStyle = "rgba(19,36,34,0.9)";
    context.fillRect(0, canvas.height - 32, canvas.width, 32);
    context.fillStyle = "#fff";
    context.font = "11px sans-serif";
    context.fillText(
      "PRIVATE · " +
        identity.slice(0, 70) +
        " · " +
        new Date().toISOString().slice(0, 10) +
        " · " +
        page +
        "/" +
        pages,
      12,
      canvas.height - 12,
    );
    return { pages, data: await canvas.encode("jpeg", 85) };
  } finally {
    if (task) await task.destroy();
  }
}
