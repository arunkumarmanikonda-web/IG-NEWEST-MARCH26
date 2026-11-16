export const positionLabels = {
  opportunity: ["", "Lead property", "Supporting property 1", "Supporting property 2"],
  product: ["", "First product", "Second product", "Third product"],
};

export function effectiveEnd(placement) {
  return placement.deadline && new Date(placement.deadline) < new Date(placement.ends_at)
    ? placement.deadline : placement.ends_at;
}

export function placementStatus(placement, now = new Date()) {
  if (placement.stopped_at) return "Stopped";
  if (new Date(effectiveEnd(placement)) <= now) return "Ended";
  return new Date(placement.starts_at) > now ? "Scheduled" : "Live";
}

export function formatIst(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Kolkata",
  });
}

export function studioHref({kind, record, placement, q, offset, slot}, anchor="") {
  const query = new URLSearchParams({kind});
  for (const [key,value] of Object.entries({record,placement,q,offset,slot})) {
    if (value) query.set(key, String(value));
  }
  return "/admin/featured?" + query + (anchor ? "#" + anchor : "");
}
