export const INTAKE_BUCKET = "ig-intake-sources";
export const INTAKE_MAX_FILES = 8;
export const sourceTypes = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
export function validateSourceSelection(files) {
  if (!Array.isArray(files) || files.length > INTAKE_MAX_FILES)
    throw new Error("Attach up to eight source files");
  let total = 0;
  for (const file of files) {
    if (!sourceTypes[String(file.name).split(".").pop().toLowerCase()])
      throw new Error(
        "Use PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, text, JPEG, PNG or WebP.",
      );
    if (!Number.isSafeInteger(file.size) || file.size < 1)
      throw new Error("Select a non-empty source file.");
    total += file.size;
  }
  return total;
}

// Only opaque IDs cross the application request boundary. Never accept a URL
// or a caller-selected bucket/path for private source downloads.
export function validateSourceIds(ids) {
  if (
    !Array.isArray(ids) ||
    ids.length > INTAKE_MAX_FILES ||
    ids.some(
      (id) =>
        typeof id !== "string" ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          id,
        ),
    ) ||
    new Set(ids).size !== ids.length
  )
    throw new Error("Choose up to eight distinct uploaded sources.");
  return ids;
}
