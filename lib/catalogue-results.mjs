// The published register supplies newest-first products across every database page.
export function catalogueResults(products, priorities, query, sort) {
  const term = query.trim().toLowerCase();
  const matched = products.filter(p => {
    const d = p.public_data;
    return [p.title, p.summary, d.sector, d.sku, d.brand, d.category, ...p.tags.map(t => t.label)]
      .join(" ").toLowerCase().includes(term);
  });
  if (sort === "name") return matched.sort((a,b) => a.title.localeCompare(b.title, "en-IN") || a.id.localeCompare(b.id));
  if (sort === "priority") {
    const positions = new Map(priorities.map(p => [p.content_id,p.slot]));
    matched.sort((a,b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }
  return matched;
}

// Keep the full approved body and SEO payload out of the client-side catalogue.
export function catalogueProduct(p) {
  const { id, slug, title, summary, tags } = p;
  const data = p.public_data;
  return { id, slug, title, summary, tags:tags.map(({label}) => ({label})), public_data: {
    brand:data.brand, sku:data.sku, category:data.category, sector:data.sector,
    image:data.image, image_alt:data.image_alt, price_label:data.price_label,
    pack_size:data.pack_size, moq:data.moq, uom:data.uom,
  } };
}
