export const slotLabels = {
  incorporation: "Certificate of incorporation",
  gst: "GST registration certificate",
  resolution: "Board resolution authorising the signatory",
  pan: "PAN card",
  passport: "Passport identity page",
  aadhaar_offline: "UIDAI digitally signed offline XML",
};
export function evidenceSlots(entity) {
  return entity.kind === "company"
    ? ["incorporation", "gst", "resolution"]
    : ["pan", entity.id_method];
}
const words = (text) =>
  String(text || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
function contains(text, value) {
  const name = words(value);
  return !!name && (" " + words(text) + " ").includes(" " + name + " ");
}
export function sameDate(text, iso) {
  if (!/^\d{4}-\d\d-\d\d$/.test(iso)) return false;
  const [y, m, d] = iso.split("-"),
    month = new Date(iso + "T12:00:00Z").toLocaleString("en-GB", {
      month: "long",
      timeZone: "UTC",
    });
  return [
    iso,
    d + " " + m + " " + y,
    Number(d) + " " + Number(m) + " " + y,
    d + " " + month + " " + y,
    Number(d) + " " + month + " " + y,
    d + " " + month.slice(0, 3) + " " + y,
    Number(d) + " " + month.slice(0, 3) + " " + y,
  ].some((date) => contains(text, date));
}
export function compareEvidence(entity, slot, text) {
  const fields = { "Legal name": contains(text, entity.legal_name) };
  if (slot === "resolution") {
    fields["Authorised signatory"] = contains(text, entity.signer);
    fields["Board authority wording"] =
      /\b(?:resolv(?:ed|es)|resolution)\b/i.test(text) &&
      /\b(?:authoris\w*|authoriz\w*|empower\w*)\b/i.test(text);
  }
  if (["incorporation", "pan", "passport"].includes(slot))
    fields[
      entity.kind === "company" ? "Date of incorporation" : "Date of birth"
    ] = sameDate(text, entity.vital_date);
  const idKey = { incorporation: "cin", gst: "gstin", pan: "pan" }[slot];
  if (idKey) fields[idKey.toUpperCase()] = contains(text, entity[idKey]);
  return {
    status: Object.values(fields).every(Boolean) ? "matched" : "review",
    fields,
  };
}
