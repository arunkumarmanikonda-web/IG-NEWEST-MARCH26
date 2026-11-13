const short = (v, n) => {
  const s = String(v || "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
};
export function teaserData(item) {
  const d = item.public_data || {},
    product = item.kind === "product";
  return {
    title: short(item.title, 145),
    summary: short(item.summary || item.body, 500),
    label: product
      ? "PRODUCT BRIEF"
      : item.kind === "opportunity"
        ? "PROPERTY BRIEF"
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
          ["Location", [d.city, d.region].filter(Boolean).join(", ")],
          ["Asset class", d.asset_class || d.sector],
          ["Transaction", d.transaction_type],
          ["Area", [d.area, d.area_unit].filter(Boolean).join(" ")],
          ["Hotel keys", d.keys],
          ["Reference", d.reference],
          ["Indicative terms", d.price_label],
        ]
    )
      .filter(([, v]) => v)
      .slice(0, 6)
      .map(([k, v]) => [k, short(v, 95)]),
  };
}
