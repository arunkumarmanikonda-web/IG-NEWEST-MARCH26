// Explicit allowlist. Executable, HTML and macro-enabled Office files are not accepted.
export const ROOM_FILE_TYPES = {
  pdf: { mime: "application/pdf", preview: true, label: "PDF" },
  doc: { mime: "application/msword", preview: false, label: "Word" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    preview: false,
    label: "Word",
  },
  rtf: { mime: "application/rtf", preview: false, label: "Rich text" },
  txt: { mime: "text/plain", preview: false, label: "Text" },
  xls: { mime: "application/vnd.ms-excel", preview: false, label: "Excel" },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    preview: false,
    label: "Excel",
  },
  csv: { mime: "text/csv", preview: false, label: "CSV" },
  ods: {
    mime: "application/vnd.oasis.opendocument.spreadsheet",
    preview: false,
    label: "OpenDocument spreadsheet",
  },
  odt: {
    mime: "application/vnd.oasis.opendocument.text",
    preview: false,
    label: "OpenDocument text",
  },
  odp: {
    mime: "application/vnd.oasis.opendocument.presentation",
    preview: false,
    label: "OpenDocument presentation",
  },
  ppt: {
    mime: "application/vnd.ms-powerpoint",
    preview: false,
    label: "PowerPoint",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    preview: false,
    label: "PowerPoint",
  },
  jpg: { mime: "image/jpeg", preview: true, label: "JPEG" },
  jpeg: { mime: "image/jpeg", preview: true, label: "JPEG" },
  png: { mime: "image/png", preview: true, label: "PNG" },
  webp: { mime: "image/webp", preview: true, label: "WebP" },
  gif: { mime: "image/gif", preview: false, label: "GIF" },
  tif: { mime: "image/tiff", preview: false, label: "TIFF" },
  tiff: { mime: "image/tiff", preview: false, label: "TIFF" },
  bmp: { mime: "image/bmp", preview: false, label: "BMP" },
  zip: { mime: "application/zip", preview: false, label: "ZIP archive" },
};
export const FILE_ACCEPT = Object.keys(ROOM_FILE_TYPES)
  .map((x) => "." + x)
  .join(",");
export const MAX_ROOM_BYTES = 20 * 1024 * 1024;
export function roomFileType(name) {
  if (
    typeof name !== "string" ||
    name.length > 180 ||
    /[\\/\x00-\x1f]/.test(name)
  )
    return null;
  return ROOM_FILE_TYPES[name.split(".").pop().toLowerCase()] || null;
}
export const nativeRoomPreview = (mime) =>
  ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mime);
export function validFileSignature(name, bytes) {
  const type = roomFileType(name);
  if (!type || !bytes?.length || bytes.length > MAX_ROOM_BYTES) return false;
  const h = Array.from(bytes.slice(0, 8)),
    starts = (s) => s.every((v, i) => h[i] === v);
  const ext = name.split(".").pop().toLowerCase();
  if (type.mime === "application/pdf")
    return new TextDecoder()
      .decode(bytes.slice(0, 1024))
      .trimStart()
      .startsWith("%PDF-");
  if (type.mime === "image/jpeg") return starts([255, 216, 255]);
  if (ext === "png") return starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (ext === "webp")
    return (
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  if (ext === "gif")
    return /^GIF8[79]a/.test(new TextDecoder().decode(bytes.slice(0, 6)));
  if (["tif", "tiff"].includes(ext))
    return starts([73, 73, 42, 0]) || starts([77, 77, 0, 42]);
  if (ext === "bmp") return starts([66, 77]);
  if (["doc", "xls", "ppt"].includes(ext))
    return starts([208, 207, 17, 224, 161, 177, 26, 225]);
  if (["docx", "xlsx", "pptx", "ods", "odt", "odp", "zip"].includes(ext))
    return starts([80, 75, 3, 4]) || (ext === "zip" && starts([80, 75, 5, 6]));
  if (ext === "rtf")
    return new TextDecoder().decode(bytes.slice(0, 10)).startsWith("{\\rtf");
  return !bytes.slice(0, 4096).includes(0);
}
