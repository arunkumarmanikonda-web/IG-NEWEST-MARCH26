import {horecaCategory,productType} from './horeca-categories.mjs';
import {productImageAlt} from './product-images.mjs';
// The published register supplies newest-first products across every database page.
export function catalogueResults(products, priorities, query, sort, filters={}) {
  const term = query.trim().toLowerCase();
  const matched = products.filter(p => {
    const d = p.public_data;
    if(filters.category && horecaCategory(p).id!==filters.category)return false;
    if(filters.brand && String(d.brand||'').toLowerCase()!==filters.brand.toLowerCase())return false;
    if(filters.type && productType(p)!==filters.type)return false;
    return [p.title, p.summary, d.sector, d.sku, d.reference, d.brand, d.category, horecaCategory(p).label,...(p.tags||[]).map(t => t.label)]
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
  return { id, slug, title, summary, tags:(tags||[]).map(({label,dimension}) => ({label,dimension})), public_data: {
    brand:data.brand, sku:data.sku, reference:data.reference, category:data.category, sector:data.sector,
    image:data.image, image_alt:productImageAlt(p), price_label:data.price_label,
    pack_size:data.pack_size, moq:data.moq, uom:data.uom,
  } };
}
