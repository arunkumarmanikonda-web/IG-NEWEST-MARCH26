import { createHash } from "node:crypto";

export function listingRevision(records) {
  const entries = records.map(({ id, version, published_at }) => [id, version, published_at]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}
