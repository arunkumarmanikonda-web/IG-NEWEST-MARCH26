import { cache } from "react";
import { cmsConfigured } from "./cms";
import { anonymousServerClient } from "./runtime-config";

export const liveFeatures = cache(async function () {
  if (!cmsConfigured()) return [];
  const {data, error} = await anonymousServerClient().rpc("ig_live_listing_features");
  if (error) {
    console.error("Featured placements unavailable", error.code);
    return [];
  }
  return data || [];
});
