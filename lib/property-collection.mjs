import {normaliseSearch,searchWords} from "./site-search.mjs";
import { propertyTagTerms } from "./taxonomy.mjs";
import { listingLifecycle, listingStatusText } from "./listing-lifecycle.mjs";

// Only already-approved public fields belong in this presentation model.
export function propertyStatus(item) {
  if (item.listing_status || item.listing_archived) return listingStatusText(item);
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
    status = "",
    sort = "newest",
  } = {},
) {
  const terms = searchWords(query);
  const result = items.filter(x => {
    const lifecycle = listingLifecycle(x);
    if (!lifecycle.visible || status === "archived" && !lifecycle.archived || status === "available" && !lifecycle.isAvailable || status && status !== "archived" && lifecycle.status !== status) return false;
    const portfolio=/portfolio reference/i.test(x.reference||"");
    if(inventory==="current"&&portfolio||inventory==="portfolio"&&!portfolio||transaction&&x.transaction!==transaction)return false;
    if ((sector && x.sector !== sector) || (city && x.location !== city) ||
        (type && x.type !== type) || (context && !x.contexts?.includes(context))) return false;
    if (!terms.length) return true;
    const labels = propertyTagTerms(x).map(tag => tag.label);
    const text = normaliseSearch([x.title,x.location,x.sector,x.type,x.transaction,x.description,listingStatusText(x),...labels].join(" "));
    return terms.every(term => text.includes(term));
  });
  // Available stock stays first, followed by pending and closed listings. Within
  // each group preserve the selected order and the CMS's chronological order.
  const rank = item => { const state = listingLifecycle(item); return state.isAvailable ? 0 : !state.isHistorical ? 1 : 2; };
  const availabilityOrder = (a, b) => rank(a) - rank(b);
  if (sort === "title")
    return result.sort((a, b) => availabilityOrder(a, b) || a.title.localeCompare(b.title));
  if (sort === "location")
    return result.sort(
      (a, b) =>
        availabilityOrder(a, b) || a.location.localeCompare(b.location) || a.title.localeCompare(b.title),
    );
  if (sort === "featured")
    return result.sort((a, b) => availabilityOrder(a, b) || (a.feature?.slot ?? 4) - (b.feature?.slot ?? 4));
  // Published records already arrive newest first, including properties awaiting a photo.
  return result.sort(availabilityOrder);
}
