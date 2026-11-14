import { DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

globalThis.DOMMatrix ??= DOMMatrix;
globalThis.ImageData ??= ImageData;
globalThis.Path2D ??= Path2D;

const chunkSize = 256 * 1024;

export async function privatePdfUrl(client, bucket, path) {
  const {data, error} = await client.storage.from(bucket).createSignedUrl(path, 600);
  if (error || !data?.signedUrl) throw new Error("The saved PDF could not be opened. Check your access to its private source.");
  return data.signedUrl;
}

// Only server-issued storage URLs reach this reader. Never buffer a full-body
// fallback when a proxy ignores Range, or expose signed URLs in exceptions.
export async function withPrivatePdf(input, use, fetcher = fetch) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const root = join(process.cwd(), "node_modules/pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(join(root, "legacy/build/pdf.worker.mjs")).href;
  const options = {isEvalSupported:false,disableFontFace:true,maxImageSize:40000000,
    standardFontDataUrl:join(root,"standard_fonts")+"/",cMapUrl:join(root,"cmaps")+"/",
    cMapPacked:true,wasmUrl:join(root,"wasm")+"/"};
  const abort = new AbortController();
  let task;
  try {
    let source;
    const failure = Promise.withResolvers();
    if (Buffer.isBuffer(input)) {
      if (input.subarray(0,5).toString() !== "%PDF-") throw new Error("Upload a valid PDF");
      source = {data:Uint8Array.from(input)};
    } else {
      let size, etag;
      async function range(begin, end) {
        const response = await fetcher(input.url, {headers:{
          Range:"bytes="+begin+"-"+(end-1), "Accept-Encoding":"identity",
          ...(etag ? {"If-Match":etag} : {})}, signal:abort.signal, cache:"no-store"});
        const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") || "");
        const total = Number(match?.[3]);
        if (response.status !== 206 || !match || !Number.isSafeInteger(total) ||
            Number(match[1]) !== begin || Number(match[2]) !== Math.min(end,total)-1 ||
            (size && total !== size) || (input.size && total !== input.size)) {
          await response.body?.cancel();
          throw new Error("The saved PDF could not be read in parts. Retry from the saved source.");
        }
        size = total;
        etag ||= response.headers.get("etag");
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length !== Math.min(end,total)-begin) throw new Error("An incomplete PDF section was received. Retry this page.");
        return bytes;
      }
      const first = await range(0, chunkSize);
      if (Buffer.from(first.subarray(0,5)).toString() !== "%PDF-") throw new Error("The saved file is not a valid PDF.");
      const transport = new pdfjs.PDFDataRangeTransport(size, first, true);
      transport.requestDataRange = (begin,end) => {
        range(begin,end).then(bytes => { if (!abort.signal.aborted) transport.onDataRange(begin,bytes); })
          .catch(() => failure.reject(new Error("The saved PDF section could not be read. Retry the same page.")));
      };
      transport.abort = () => abort.abort();
      source = {range:transport, rangeChunkSize:chunkSize, disableStream:true, disableAutoFetch:true};
    }
    task = pdfjs.getDocument({...options,...source});
    return await Promise.race([task.promise.then(doc => use(doc,pdfjs)),failure.promise]);
  } finally {
    abort.abort();
    if (task) await task.destroy();
  }
}
