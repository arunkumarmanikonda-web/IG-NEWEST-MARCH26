import path from "node:path";
import { createHash } from "node:crypto";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { pathToFileURL } from "node:url";
import { createWorker } from "tesseract.js";
import { compareEvidence } from "./identity-evidence.mjs";

export async function checkEvidence(entity, slot, blob) {
  if (blob.size > 10_000_000) throw new Error("Evidence exceeds 10 MB");
  const bytes = Buffer.from(await blob.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  let worker,
    task,
    text = "",
    pagesRead = 0;
  async function recognise(image) {
    worker ??= await createWorker("eng", 1, {
      langPath: path.join(
        process.cwd(),
        "node_modules/@tesseract.js-data/eng/4.0.0_best_int",
      ),
      cacheMethod: "none",
      errorHandler: () => {},
    });
    return (await worker.recognize(image)).data.text;
  }
  try {
    if (bytes.subarray(0, 5).toString() === "%PDF-") {
      globalThis.DOMMatrix ??= DOMMatrix;
      globalThis.ImageData ??= ImageData;
      globalThis.Path2D ??= Path2D;
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const dir = path.join(process.cwd(), "node_modules/pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(dir, "legacy/build/pdf.worker.mjs"),
      ).href;
      task = pdfjs.getDocument({
        data: new Uint8Array(bytes),
        isEvalSupported: false,
        maxImageSize: 16_000_000,
        canvasMaxAreaInBytes: 64_000_000,
        useSystemFonts: true,
        standardFontDataUrl: dir + "/standard_fonts/",
        wasmUrl: dir + "/wasm/",
      });
      const pdf = await task.promise;
      if (pdf.numPages > 6) throw new Error("Provide only the relevant six evidence pages for automated checking");
      // Read the visible page itself, including scans, so hidden PDF text cannot qualify a match.
      for (let i = 1; i <= Math.min(6, pdf.numPages); i++) {
        const page = await pdf.getPage(i),
          base = page.getViewport({ scale: 1 });
        const vp = page.getViewport({
          scale: Math.min(2, 1900 / base.width, 2400 / base.height),
        });
        const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
        await page.render({ canvas, viewport: vp, background: "white" })
          .promise;
        text += "\n" + (await recognise(await canvas.encode("png")));
        pagesRead = i;
        if (compareEvidence(entity, slot, text).status === "matched") break;
      }
    } else {
      if (
        !(
          bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ||
          bytes.subarray(0, 3).toString("hex") === "ffd8ff"
        )
      )
        throw new Error("Unsupported evidence");
      const sharp = (await import("sharp")).default;
      const raster = await sharp(bytes, { limitInputPixels: 16000000 })
        .rotate()
        .resize({
          width: 2200,
          height: 2600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
      text = await recognise(raster);
      pagesRead = 1;
    }
    return {
      ...compareEvidence(entity, slot, text),
      pages_read: pagesRead,
      sha256,
    };
  } finally {
    if (task) await task.destroy();
    if (worker) await worker.terminate();
  }
}

export async function checkBytes(entity,slot,bytes,mime) { return checkEvidence(entity,slot,new Blob([bytes],{type:mime})); }
