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
    sort = "featured",
  } = {},
) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const result = items.filter(
    (x) =>
      (!sector || x.sector === sector) &&
      (!city || x.location === city) &&
      (!type || x.type === type) &&
      (!context || x.contexts?.includes(context)) &&
      terms.every((term) =>
        [x.title, x.location, x.sector, x.type, x.description]
          .join(" ")
          .toLowerCase()
          .includes(term),
      ),
  );
  if (sort === "title")
    return result.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "location")
    return result.sort(
      (a, b) =>
        a.location.localeCompare(b.location) || a.title.localeCompare(b.title),
    );
  // Keep the CMS order within each group, with photograph-led records first.
  return result.sort(
    (a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)),
  );
}
