import { createHash } from "node:crypto";
import {
  INTAKE_BUCKET,
  sourceTypes,
  validateSourceIds,
  validateSourceSelection,
} from "./intake-source-spec.mjs";

export async function resolveIntakeSources(client, ids, practice) {
  validateSourceIds(ids);
  if (!ids.length) return [];
  const { data: rows, error } = await client.rpc("ig_intake_sources_manage", {
    p: { action: "resolve", ids, practice },
  });
  if (error)
    throw new Error(
      "These sources are unavailable or outside your current practice permissions.",
    );
  if (!Array.isArray(rows) || rows.length !== ids.length)
    throw new Error("Uploaded source records are incomplete.");
  const ordered = ids.map((id) => rows.find((row) => row.id === id));
  if (
    ordered.some(
      (row) =>
        !row ||
        row.practice !== practice ||
        row.mime !== sourceTypes[row.name.split(".").pop().toLowerCase()],
    )
  )
    throw new Error("Uploaded source metadata does not match this draft.");
  validateSourceSelection(ordered);
  return ordered;
}

export async function loadIntakeSources(client, ids, practice) {
  const ordered = await resolveIntakeSources(client, ids, practice);
  const files = [];
  for (const row of ordered) {
    const { data: blob, error: downloadError } = await client.storage
      .from(row.bucket === "ig-data-rooms" ? "ig-data-rooms" : INTAKE_BUCKET)
      .download(row.path);
    if (downloadError || !blob || blob.size !== row.size)
      throw new Error(
        "Source upload incomplete: " + row.name + ". Retry the same file.",
      );
    const bytes = Buffer.from(await blob.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== row.sha256)
      throw new Error(
        "Source integrity check failed: " +
          row.name +
          ". Choose the original file again.",
      );
    files.push({ name: row.name, bytes, source_id: row.id });
  }
  return files;
}
