export function listingImageBrief(
  listing,
  { mode = "generate", direction = "" } = {},
) {
  if (!["generate", "enhance"].includes(mode))
    throw new Error("Choose generate or enhance");
  const text = [listing?.summary, listing?.body]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (String(listing?.title || "").trim().length < 2 || text.length < 12)
    throw new Error("Enter a listing title and useful description first.");
  const instruction =
    mode === "enhance"
      ? "Professionally enhance @source: improve lighting, exposure and visual clarity. Preserve every structure, facade, boundary and feature. Do not add floors, landscaping, amenities or signage."
      : "Create a realistic editorial concept for this property category using only the supplied brief. This is illustrative, not an actual property photograph. Do not invent identifiable buildings, maps, landmarks, amenities or completed works.";
  return (
    instruction +
    " Corporate architectural photography, natural light, neutral colours, no text, logos or watermarks. Brief: " +
    text.slice(0, 300) +
    ". " +
    String(direction).slice(0, 120)
  ).slice(0, 900);
}
