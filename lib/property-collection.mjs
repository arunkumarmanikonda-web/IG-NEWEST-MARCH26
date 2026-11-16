import { propertyTagTerms } from "./taxonomy.mjs";

// Only already-approved public fields belong in this presentation model.
export function propertyStatus(item) {
  if (/portfolio reference/i.test(item.reference || ""))
    return "Portfolio reference";
  return item.availability || "Availability on enquiry";
}
export function propertyFacts(item) {
  return [
    ["Property type", item.assetClass || item.sector],
    ["Transaction", item.transaction],
    ["Area", [item.area, item.areaUnit].filter(Boolean).join(" ")],
    ["Keys", item.keys],
    ["Tenure", item.tenure],
  ].filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
}
export function collectionItems(
  items,
  {
    query = "",
    sector = "",
    city = "",
    type = "",
    context = "",
    sort = "newest",
  } = {},
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = items.filter(x => {
    if ((sector && x.sector !== sector) || (city && x.location !== city) ||
        (type && x.type !== type) || (context && !x.contexts?.includes(context))) return false;
    if (!terms.length) return true;
    const labels = propertyTagTerms(x).map(tag => tag.label);
    const text = [x.title, x.location, x.sector, x.type, x.description, ...labels].join(" ").toLowerCase();
    return terms.every(term => text.includes(term));
  });
  if (sort === "title")
    return result.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "location")
    return result.sort(
      (a, b) =>
        a.location.localeCompare(b.location) || a.title.localeCompare(b.title),
    );
  if (sort === "featured")
    return result.sort((a, b) => (a.feature?.slot ?? 4) - (b.feature?.slot ?? 4));
  // Published records already arrive newest first, including properties awaiting a photo.
  return result;
}
