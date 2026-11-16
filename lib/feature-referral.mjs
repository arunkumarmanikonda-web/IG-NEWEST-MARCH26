const featurePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const listingPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function featureId(value) {
  return typeof value === "string" && featurePattern.test(value) ? value.toLowerCase() : null;
}

export function listingReferral(feature, listing) {
  const id = featureId(feature);
  if (!id || typeof listing !== "string" || listing.length > 120 || !listingPattern.test(listing)) return null;
  return { feature_id: id, listing_slug: listing };
}
