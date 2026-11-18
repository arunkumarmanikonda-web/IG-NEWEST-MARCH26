import { featureId } from "./feature-referral.mjs";

// A shared room link may retain only a local portal destination through sign-in.
export function portalReturn(value) {
  if (typeof value !== "string") return null;
  if (["/horeca#quotation-basket", "/shortlist", "/account/shortlist", "/account/enquiries"].includes(value)) return value;
  const referral = /^(\/account\/nda\?opportunity=[a-z0-9-]{1,120})&feature=([^&]+)$/.exec(value);
  if (referral) return featureId(referral[2]) ? referral[1] + "&feature=" + featureId(referral[2]) : null;
  return /^\/account\/(?:legal-names|data-rooms\/[a-f0-9-]{36}|nda\?(?:opportunity|project)=[a-z0-9-]{1,180})$/.test(value) ? value : null;
}
