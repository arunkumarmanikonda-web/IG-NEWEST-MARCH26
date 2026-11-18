import {normaliseSearch,searchWords} from "./site-search.mjs";
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
    ["Management agreement",item.managementAgreement],
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
    inventory = "all",
    transaction = "",
    sort = "newest",
  } = {},
) {
  const terms = searchWords(query);
  const result = items.filter(x => {
    const portfolio=/portfolio reference/i.test(x.reference||"");
    if(inventory==="current"&&portfolio||inventory==="portfolio"&&!portfolio||transaction&&x.transaction!==transaction)return false;
    if ((sector && x.sector !== sector) || (city && x.location !== city) ||
        (type && x.type !== type) || (context && !x.contexts?.includes(context))) return false;
    if (!terms.length) return true;
    const labels = propertyTagTerms(x).map(tag => tag.label);
    const text = normaliseSearch([x.title,x.location,x.sector,x.type,x.transaction,x.description,...labels].join(" "));
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
