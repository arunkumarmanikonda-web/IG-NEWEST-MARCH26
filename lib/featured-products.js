import { cache } from "react";
import { createHash } from "node:crypto";
import { cmsConfigured } from "./cms";
import { anonymousServerClient } from "./runtime-config";

// Fetch only the selected public snapshots for homepage rendering and refresh.
export const featuredProducts = cache(async function () {
  const empty = { products: [], revision: "no-product-priorities" };
  if (!cmsConfigured()) return empty;
  const client = anonymousServerClient();
  const { data: placements, error } = await client.rpc("ig_live_product_priorities");
  if (error) {
    console.error("HORECA priorities unavailable", error.code);
    return empty;
  }
  if (!placements?.length) return empty;
  const { data, error: lookupError } = await client.from("ig_public_content")
    .select("id,slug,title,summary,version,public_data")
    .eq("kind", "product").in("id", placements.map(row => row.content_id));
  if (lookupError) {
    console.error("Published HORECA priorities unavailable", lookupError.code);
    return empty;
  }
  const byId = new Map(data.map(product => [product.id, product]));
  const products = placements.slice().sort((a,b) => a.slot-b.slot)
    .filter(placement => byId.has(placement.content_id))
    .map(placement => ({ ...byId.get(placement.content_id), placement }));
  const revision = createHash("sha256").update(JSON.stringify(products.map(p => [
    p.id, p.version, p.placement.id, p.placement.slot, p.placement.starts_at, p.placement.ends_at,
  ]))).digest("hex");
  return {products, revision};
});
