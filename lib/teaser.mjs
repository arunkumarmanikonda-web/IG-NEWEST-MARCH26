import {listingLifecycle,listingStatusText} from './listing-lifecycle.mjs';
const short = (v, n) => {
  const s = String(v || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
};
export function narrativeParagraphs(body,summary) {
  return String(body||"")
    .replace(/&#(?:x20|32);/gi," ")
    .replace(/^[ \t]*#{1,3}[ \t]+([^\n]+)$/gm,(_,heading)=>"\n\n## "+heading.trim()+"\n\n")
    .split(/\n\s*\n/)
    .map(paragraph=>paragraph.trim())
    .filter(paragraph=>paragraph && paragraph!==summary?.trim());
}
export function teaserData(item) {
  const d = item.public_data || {},
    product = item.kind === "product";
  const lifecycle=item.kind==='opportunity'?listingLifecycle(item):null;
  return {
    title: short(item.title, 145),
    summary: short(item.summary || item.body, 500),
    label: product
      ? "PRODUCT BRIEF"
      : item.kind === "opportunity"
        ? lifecycle?.archived ? "ARCHIVED PROPERTY BRIEF" : "PROPERTY BRIEF"
        : "PROJECT & PRACTICE BRIEF",
    image:
      /^\/images\/[a-zA-Z0-9._/-]+$/.test(d.image || "") &&
      !d.image.includes("..")
        ? d.image
        : null,
    illustrative: d.image?.startsWith("/images/generated/"),
    line: short(
      product
        ? [d.brand, d.category].filter(Boolean).join(" / ")
        : [d.sector, d.city, d.region].filter(Boolean).join(" / "),
      120,
    ),
    facts: (product
      ? [
          ["Brand", d.brand],
          ["SKU / reference", d.sku || d.reference],
          ["Unit", d.uom],
          ["MOQ / pack", [d.moq, d.pack_size].filter(Boolean).join(" / ")],
          ["Lead time", d.lead_days ? d.lead_days + " days" : ""],
          ["Indicative terms", d.price_label],
        ]
      : [
          ["Status", lifecycle && (d.listing_status || !lifecycle.isAvailable) ? listingStatusText(item) : ""],
          ["Location", [d.city, d.region].filter(Boolean).join(", ")],
          ["Asset class", d.asset_class || d.sector],
          ["Transaction", d.transaction_type],
          ["Area", [d.area, d.area_unit].filter(Boolean).join(" ")],
          ["Hotel keys", d.keys],
          ["Reference", d.reference === "Portfolio reference" ? "" : d.reference],
          ["Indicative terms", d.price_label],
          ["Tenure", d.tenure],
          ["Management agreement",d.management_agreement],
          ["Information period",d.data_as_of],
          ["Facts reviewed",d.last_verified_at],
        ]
    )
      .filter(([, v]) => v)
      .slice(0, product ? 6 : undefined)
      .map(([k, v]) => [k, product ? short(v, 95) : String(v)]),
  };
}
