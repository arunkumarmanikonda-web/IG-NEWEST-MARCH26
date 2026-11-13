import { prepareIntakeDraft, contentFields } from "./intake.mjs";
import { slugFromTitle } from "./content-routes.mjs";

// Private evidence keeps every extracted fact; only publishable fields enter the draft.
export function intakeContent(job, record) {
  const draft = prepareIntakeDraft(job.draft);
  const data = { ...record.public_data };
  for (const key of contentFields) {
    if (["latitude", "longitude"].includes(key)) continue;
    const value = draft.fields?.[key];
    if (typeof value === "string" && value.trim())
      data[key] = value.slice(0, 500);
  }
  // SKU allocation is authoritative in the database, unless a valid source SKU exists.
  if (data.sku && !/^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/.test(data.sku))
    delete data.sku;
  data.seo_keywords = (draft.keywords || []).join(", ").slice(0, 500);
  return {
    slug:
      record.kind === "opportunity" || record.version > 1
        ? record.slug
        : `${slugFromTitle(draft.title) || record.kind}-${record.id.slice(0, 8)}`,
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    seo_title: draft.seo_title,
    seo_description: draft.seo_description,
    public_data: data,
    term_ids: [],
  };
}
