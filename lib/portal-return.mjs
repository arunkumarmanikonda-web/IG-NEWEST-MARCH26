// A shared room link may retain only a local portal destination through sign-in.
export function portalReturn(value) {
  if (typeof value !== "string") return null;
  return /^\/account\/(?:data-rooms\/[a-f0-9-]{36}|nda\?opportunity=[a-z0-9-]{1,180})$/.test(value) ? value : null;
}
