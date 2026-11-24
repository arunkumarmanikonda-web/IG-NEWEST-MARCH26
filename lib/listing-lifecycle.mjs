export const listingStatuses = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "under_offer", label: "Under offer" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

const clean = value => typeof value === "string" ? value.trim() : "";

// Supports a public CMS record, its card projection, or public_data itself.
// Custom wording is presentation only and can never turn a closed asset into an offer.
export function listingLifecycle(record = {}, now = Date.now()) {
  const d = record?.public_data || record || {};
  const explicit = clean(d.listing_status);
  const legacy = clean(d.availability);
  let status = listingStatuses.some(option => option.value === explicit) ? explicit : explicit ? "withdrawn" : "available";
  if (!explicit) {
    if (/\bsold\b|\bleased\b/i.test(legacy)) status = "sold";
    else if (/\breserved\b|\bon hold\b/i.test(legacy)) status = "reserved";
    else if (/\bunder[ -]offer\b/i.test(legacy)) status = "under_offer";
    else if (/\bwithdrawn\b|\bclosed\b|\bunavailable\b|\bnot available\b|\boff[ -]market\b/i.test(legacy)) status = "withdrawn";
  }
  const archived = d.listing_archived === true;
  const archiveUntil = clean(d.listing_archive_until) || null;
  const expires = archiveUntil ? Date.parse(archiveUntil) : NaN;
  const visible = !archived || Number.isFinite(expires) && expires > Number(now);
  const isPortfolio = /portfolio reference/i.test(clean(d.reference));
  const canonicalLabel = listingStatuses.find(option => option.value === status).label;
  const customLabel = clean(d.listing_status_label).slice(0, 50);
  const label = customLabel || canonicalLabel;
  return {
    status, label, canonicalLabel, customLabel, archived, archiveUntil, visible,
    isPortfolio,
    isAvailable: visible && !archived && !isPortfolio && status === "available",
    isHistorical: archived || isPortfolio || status === "sold" || status === "withdrawn",
  };
}

export function listingStatusText(record, now = Date.now()) {
  const state = listingLifecycle(record, now);
  if (state.archived && state.status === "available") return state.customLabel ? state.customLabel + " · Archived" : "Archived";
  if (state.isPortfolio && !state.archived && state.status === "available") return "Portfolio reference";
  const labels = [state.label];
  if (state.label.toLowerCase() !== state.canonicalLabel.toLowerCase()) labels.push(state.canonicalLabel);
  if (state.archived) labels.push("Archived");
  return labels.join(" · ");
}
