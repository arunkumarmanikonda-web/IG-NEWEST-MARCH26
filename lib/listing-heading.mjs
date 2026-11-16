const connectives = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);
const abbreviations = new Set([
  "CIRP",
  "NCLT",
  "NCR",
  "RFQ",
  "JV",
  "JDA",
  "SPV",
  "GST",
  "GSTIN",
  "RERA",
  "NOI",
  "EBITDA",
  "FSI",
  "FAR",
  "HORECA",
  "PM",
  "PMC",
  "NH",
  "IT",
  "SEZ",
]);

export function listingHeading(value) {
  const text = String(value || "").trim();
  const capitals = text === text.toUpperCase();
  return text.replace(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu, (word, at) => {
    const lower = word.toLowerCase();
    if (at > 0 && at + word.length < text.length && connectives.has(lower))
      return lower;
    if (abbreviations.has(word.toUpperCase())) return word.toUpperCase();
    if (!capitals && /[A-Z]/.test(word.slice(1))) return word;
    return word[0].toUpperCase() + (capitals ? lower.slice(1) : word.slice(1));
  });
}
