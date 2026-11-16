export function listingImageBrief(
  listing,
  { mode = "generate", direction = "", reference = false } = {},
) {
  if (!["generate", "enhance", "sketch"].includes(mode))
    throw new Error("Choose a listing image style");
  const text = [listing?.summary, listing?.body]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (String(listing?.title || "").trim().length < 2 || text.length < 12)
    throw new Error("Enter a listing title and useful description first.");
  const instruction =
    mode === "sketch"
      ? (reference ? "Draw an architectural pencil-and-ink sketch of @source. Keep its viewpoint, silhouette, openings, proportions and setting faithful to the photograph." : "Draw an illustrative architectural pencil-and-ink concept for this property category. Avoid identifiable facades or unsupported architectural features.") + " Fine linework, restrained shading, warm paper, no captions, logos or invented amenities."
      : mode === "enhance"
      ? "Professionally enhance @source: improve lighting, exposure and visual clarity. Preserve every structure, facade, boundary and feature. Do not add floors, landscaping, amenities or signage."
      : "Create a realistic editorial concept for this property category using only the supplied brief. This is illustrative, not an actual property photograph. Do not invent identifiable buildings, maps, landmarks, amenities or completed works.";
  return (
    instruction +
    (mode === "sketch" ? " Brief: " : " Corporate architectural photography, natural light, neutral colours, no text, logos or watermarks. Brief: ") +
    text.slice(0, 300) +
    ". " +
    String(direction).slice(0, 120)
  ).slice(0, 900);
}

export function listingVisualStyle(selected, direction='', creative='') {
  if(selected==='sketch'||selected==='photo')return selected;
  for(const instruction of [direction,creative]){
    if(/\b(?:no|without|avoid|instead of) (?:an? )?(?:architectural )?sketch|\b(?:use|keep) (?:the |a |an )?(?:source |original |actual )?(?:photo|photograph)\b/i.test(instruction))return 'photo';
    if(/\b(sketch(?:ed|es)?|pencil drawing|line drawing|line art)\b/i.test(instruction))return 'sketch';
  }
  return 'photo';
}

export function propertyPhotoURL(path) {
  return path?.startsWith('/images/library/') ? path+'?view=property' : path;
}
