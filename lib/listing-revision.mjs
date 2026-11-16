import { createHash } from "node:crypto";

export function listingRevision(records, features = []) {
  const entries = records.map(({ id, version, published_at }) => [id, version, published_at]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify([entries,features.map(f => [f.id,f.content_id,f.slot,f.headline,f.starts_at,f.ends_at]).sort(([a],[b]) => a.localeCompare(b))])).digest("hex");
}
