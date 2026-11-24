// Listing display dates are calendar dates in India, independent of the editor's device zone.
export function indiaDate(value = Date.now()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

export function archiveDateAfter(days, now = Date.now()) {
  const date = new Date(indiaDate(now) + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

export function archiveDateDeadline(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error("Choose the last date this listing should be visible.");
  const date = new Date(value + "T23:59:59.999+05:30");
  if (!Number.isFinite(date.getTime()) || indiaDate(date) !== value) throw new Error("Choose a valid display date.");
  return date.toISOString();
}

export function archiveDateLabel(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(value));
}
