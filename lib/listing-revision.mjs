import { createHash } from "node:crypto";

export function listingRevision(records, features = []) {
  const entries = records.map(({ id, version, published_at, public_data = {}, tags = [] }) => {
    const labels = tags.map(tag => [tag.id, tag.slug, tag.label, tag.dimension]);
    labels.sort(([a], [b]) => a.localeCompare(b));
    return [id, version, published_at, labels, public_data.listing_status, public_data.listing_status_label, public_data.listing_archived, public_data.listing_archive_until];
  });
  entries.sort(([a], [b]) => a.localeCompare(b));
  return createHash("sha256").update(JSON.stringify([entries,features.map(f => [f.id,f.content_id,f.slot,f.headline,f.starts_at,f.ends_at]).sort(([a],[b]) => a.localeCompare(b))])).digest("hex");
}
